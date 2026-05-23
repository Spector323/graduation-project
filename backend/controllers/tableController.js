const prisma = require('../config/database');

exports.getAllTables = async (req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: { number: 'asc' },
    });

    res.json(tables);
  } catch (error) {
    console.error('Get all tables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { number, capacity, location } = req.body;

    if (!number) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    const existingTable = await prisma.restaurantTable.findUnique({
      where: { number },
    });
    if (existingTable) {
      return res.status(400).json({ error: 'Table with this number already exists' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        number,
        capacity: capacity || 4,
        location: location || '',
      },
    });

    res.status(201).json({ message: 'Table created successfully', table });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, location, status } = req.body;

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(number && { number }),
        ...(capacity && { capacity }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
      },
    });

    res.json({ message: 'Table updated successfully', table });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.restaurantTable.delete({
      where: { id },
    });

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTableStats = async (req, res) => {
  try {
    const [totalTables, freeTables, reservedTables, occupiedTables] = await Promise.all([
      prisma.restaurantTable.count(),
      prisma.restaurantTable.count({ where: { status: 'FREE' } }),
      prisma.restaurantTable.count({ where: { status: 'RESERVED' } }),
      prisma.restaurantTable.count({ where: { status: 'OCCUPIED' } }),
    ]);

    res.json({
      totalTables,
      freeTables,
      reservedTables,
      occupiedTables,
    });
  } catch (error) {
    console.error('Get table stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
