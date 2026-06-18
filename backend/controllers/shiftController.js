const prisma = require('../config/database');

// Открыть смену
exports.openShift = async (req, res) => {
  try {
    const { cashStart } = req.body;
    const { userId, establishmentId } = req;

    // Проверяем, есть ли уже открытая смена
    const existingShift = await prisma.shift.findFirst({
      where: {
        establishmentId,
        status: 'OPEN',
      },
    });

    if (existingShift) {
      return res.status(400).json({ error: 'Смена уже открыта' });
    }

    const shift = await prisma.shift.create({
      data: {
        cashStart: parseFloat(cashStart) || 0,
        openedById: userId,
        establishmentId,
        status: 'OPEN',
      },
      include: {
        openedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Open shift error:', error);
    res.status(500).json({ error: 'Не удалось открыть смену' });
  }
};

// Закрыть смену
exports.closeShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { cashEnd } = req.body;
    const { userId } = req;

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Смена не найдена' });
    }

    if (shift.status !== 'OPEN') {
      return res.status(400).json({ error: 'Смена уже закрыта' });
    }

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        cashEnd: parseFloat(cashEnd) || 0,
        closedById: userId,
        closedAt: new Date(),
        status: 'CLOSED',
      },
      include: {
        openedBy: { select: { id: true, fullName: true } },
        closedBy: { select: { id: true, fullName: true } },
      },
    });

    res.json(updatedShift);
  } catch (error) {
    console.error('Close shift error:', error);
    res.status(500).json({ error: 'Не удалось закрыть смену' });
  }
};

// Получить текущую смену
exports.getCurrentShift = async (req, res) => {
  try {
    const { establishmentId } = req;

    const shift = await prisma.shift.findFirst({
      where: {
        establishmentId,
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, fullName: true } },
        establishment: { select: { id: true, name: true } },
      },
    });

    res.json(shift || null);
  } catch (error) {
    console.error('Get current shift error:', error);
    res.status(500).json({ error: 'Не удалось получить смену' });
  }
};

// Получить историю смен
exports.getShifts = async (req, res) => {
  try {
    const { establishmentId } = req;
    const { limit = 50, offset = 0 } = req.query;

    const shifts = await prisma.shift.findMany({
      where: { establishmentId },
      include: {
        openedBy: { select: { id: true, fullName: true } },
        closedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.shift.count({ where: { establishmentId } });

    res.json({ shifts, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Не удалось загрузить смены' });
  }
};
