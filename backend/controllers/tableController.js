const prisma = require('../config/database');

exports.getAllTables = async (req, res) => {
  try {
    if (!req.establishmentId) {
      return res.status(400).json({ error: 'Заведение не определено' });
    }

    const tables = await prisma.restaurantTable.findMany({
      where: { establishmentId: req.establishmentId },
      orderBy: { number: 'asc' },
    });

    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Не удалось загрузить столы' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { number, capacity, location } = req.body;

    if (!number) {
      return res.status(400).json({ error: 'Номер стола обязателен' });
    }

    const existingTable = await prisma.restaurantTable.findFirst({
      where: { number, establishmentId: req.establishmentId },
    });
    if (existingTable) {
      return res.status(400).json({ error: 'Стол с таким номером уже существует' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        number,
        capacity: capacity || 4,
        location: location || '',
        establishmentId: req.establishmentId,
      },
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Не удалось создать стол' });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, location, status } = req.body;

    const table = await prisma.restaurantTable.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!table) {
      return res.status(404).json({ error: 'Стол не найден' });
    }

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(number && { number }),
        ...(capacity && { capacity }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Не удалось обновить стол' });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await prisma.restaurantTable.findFirst({
      where: { id, establishmentId: req.establishmentId },
    });
    if (!table) {
      return res.status(404).json({ error: 'Стол не найден' });
    }

    await prisma.restaurantTable.delete({ where: { id } });
    res.json({ message: 'Стол удалён' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Не удалось удалить стол' });
  }
};

exports.getTableStats = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;

    const [totalTables, freeTables, reservedTables, occupiedTables] = await Promise.all([
      prisma.restaurantTable.count({ where: { establishmentId } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'FREE' } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'RESERVED' } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'OCCUPIED' } }),
    ]);

    res.json({ totalTables, freeTables, reservedTables, occupiedTables });
  } catch (error) {
    console.error('Get table stats error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику столов' });
  }
};
