const prisma = require('../config/database');
const { emitToEstablishment } = require('../socket');

exports.getAllReservations = async (req, res) => {
  try {
    if (!req.establishmentId) {
      return res.status(400).json({ error: 'Заведение не определено' });
    }

    const { status } = req.query;
    const where = { establishmentId: req.establishmentId };
    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { table: true, user: true },
      orderBy: { reservedAt: 'asc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Не удалось загрузить бронирования' });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { tableId, customerName, customerPhone, reservedAt, partySize, notes } = req.body;

    if (!customerName || !reservedAt) {
      return res.status(400).json({
        error: 'Имя клиента и время бронирования обязательны',
      });
    }

    if (tableId) {
      const table = await prisma.restaurantTable.findFirst({
        where: { id: tableId, establishmentId: req.establishmentId },
      });
      if (!table) {
        return res.status(400).json({ error: 'Стол не найден' });
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        tableId: tableId || null,
        customerName,
        customerPhone: customerPhone || '',
        reservedAt: new Date(reservedAt),
        partySize: partySize || 2,
        notes: notes || '',
        status: 'PENDING',
        userId: req.userId,
        establishmentId: req.establishmentId,
      },
      include: { table: true },
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'RESERVED' },
      });
    }

    emitToEstablishment(req.establishmentId, 'reservation:created', reservation);
    if (tableId) {
      emitToEstablishment(req.establishmentId, 'table:updated', { id: tableId, status: 'RESERVED' });
    }
    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Не удалось создать бронирование' });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tableId } = req.body;

    const reservation = await prisma.reservation.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(tableId !== undefined && { tableId }),
      },
      include: { table: true },
    });

    if (status === 'CONFIRMED' && updated.tableId) {
      await prisma.restaurantTable.update({
        where: { id: updated.tableId },
        data: { status: 'RESERVED' },
      });
    }

    emitToEstablishment(req.establishmentId, 'reservation:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Не удалось обновить бронирование' });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }

    await prisma.reservation.delete({ where: { id } });
    emitToEstablishment(req.establishmentId, 'reservation:deleted', { id });
    res.json({ message: 'Бронирование удалено' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Не удалось удалить бронирование' });
  }
};

exports.getTodayReservations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        establishmentId: req.establishmentId,
        reservedAt: { gte: today, lt: tomorrow },
      },
      include: { table: true, user: true },
      orderBy: { reservedAt: 'asc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get today reservations error:', error);
    res.status(500).json({ error: 'Не удалось получить сегодняшние бронирования' });
  }
};
