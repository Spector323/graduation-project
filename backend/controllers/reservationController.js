const prisma = require('../config/database');

exports.getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: true,
        user: true,
      },
      orderBy: { reservedAt: 'asc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { tableId, customerName, customerPhone, reservedAt, partySize, notes } = req.body;

    if (!customerName || !reservedAt) {
      return res.status(400).json({ error: 'Customer name and reservation time are required' });
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
      },
      include: {
        table: true,
      },
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'RESERVED' },
      });
    }

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tableId } = req.body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(tableId !== undefined && { tableId }),
      },
      include: {
        table: true,
      },
    });

    if (status === 'CONFIRMED' && reservation.tableId) {
      await prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'RESERVED' },
      });
    }

    res.json({ message: 'Reservation updated successfully', reservation });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.reservation.delete({
      where: { id },
    });

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        reservedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        table: true,
        user: true,
      },
      orderBy: { reservedAt: 'asc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get today reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
