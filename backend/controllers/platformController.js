const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

exports.getAllEstablishments = async (req, res) => {
  try {
    const establishments = await prisma.establishment.findMany({
      include: {
        _count: { select: { users: true, tables: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = await Promise.all(establishments.map(async (est) => {
      const orderCount = await prisma.order.count({
        where: { table: { establishmentId: est.id } },
      });
      const revenue = await prisma.order.aggregate({
        where: { table: { establishmentId: est.id }, status: 'COMPLETED' },
        _sum: { total: true },
      });
      return {
        ...est,
        orderCount,
        totalRevenue: revenue._sum.total || 0,
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('Get all establishments error:', error);
    res.status(500).json({ error: 'Не удалось загрузить заведения' });
  }
};

exports.getEstablishment = async (req, res) => {
  try {
    const { id } = req.params;

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, tables: true, categories: true, reservations: true } },
      },
    });

    if (!establishment) {
      return res.status(404).json({ error: 'Заведение не найдено' });
    }

    const [orderCount, revenue, activeOrders] = await Promise.all([
      prisma.order.count({ where: { table: { establishmentId: id } } }),
      prisma.order.aggregate({
        where: { table: { establishmentId: id }, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { table: { establishmentId: id }, status: { in: ['NEW', 'COOKING', 'READY', 'PAID', 'IN_QUEUE'] } },
      }),
    ]);

    const users = await prisma.user.findMany({
      where: { establishmentId: id },
      select: { id: true, email: true, fullName: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      ...establishment,
      orderCount,
      totalRevenue: revenue._sum.total || 0,
      activeOrders,
      users,
    });
  } catch (error) {
    console.error('Get establishment error:', error);
    res.status(500).json({ error: 'Не удалось загрузить заведение' });
  }
};

exports.createEstablishment = async (req, res) => {
  try {
    const { name, type, address, phone, adminEmail, adminPassword, adminName } = req.body;

    if (!name || !type || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email администратора уже используется' });
    }

    const establishment = await prisma.establishment.create({
      data: { name, type, address: address || '', phone: phone || '' },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: adminName,
        role: 'ADMIN',
        establishmentId: establishment.id,
      },
      select: { id: true, email: true, fullName: true, role: true, establishmentId: true, createdAt: true },
    });

    res.status(201).json({ establishment, admin });
  } catch (error) {
    console.error('Create establishment error:', error);
    res.status(500).json({ error: 'Не удалось создать заведение' });
  }
};

exports.updateEstablishment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, address, phone } = req.body;

    const data = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;

    const establishment = await prisma.establishment.update({
      where: { id },
      data,
    });

    res.json(establishment);
  } catch (error) {
    console.error('Update establishment error:', error);
    res.status(500).json({ error: 'Не удалось обновить заведение' });
  }
};

exports.deleteEstablishment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.orderItem.deleteMany({ where: { order: { table: { establishmentId: id } } } });
    await prisma.order.deleteMany({ where: { table: { establishmentId: id } } });
    await prisma.reservation.deleteMany({ where: { establishmentId: id } });
    await prisma.menuItem.deleteMany({ where: { category: { establishmentId: id } } });
    await prisma.menuCategory.deleteMany({ where: { establishmentId: id } });
    await prisma.restaurantTable.deleteMany({ where: { establishmentId: id } });
    await prisma.user.deleteMany({ where: { establishmentId: id } });
    await prisma.establishment.delete({ where: { id } });

    res.json({ message: 'Заведение удалено' });
  } catch (error) {
    console.error('Delete establishment error:', error);
    res.status(500).json({ error: 'Не удалось удалить заведение' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
        establishmentId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const establishmentIds = [...new Set(users.filter(u => u.establishmentId).map(u => u.establishmentId))];
    const establishments = await prisma.establishment.findMany({
      where: { id: { in: establishmentIds } },
      select: { id: true, name: true, type: true },
    });
    const estMap = new Map(establishments.map(e => [e.id, e]));

    const result = users.map(user => ({
      ...user,
      establishment: user.establishmentId ? estMap.get(user.establishmentId) || null : null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Не удалось загрузить пользователей' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const [totalEstablishments, totalUsers, totalOrders, totalRevenue, activeOrders, totalTables] = await Promise.all([
      prisma.establishment.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true } }),
      prisma.order.count({ where: { status: { in: ['NEW', 'COOKING', 'READY', 'PAID', 'IN_QUEUE'] } } }),
      prisma.restaurantTable.count(),
    ]);

    res.json({
      totalEstablishments,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      activeOrders,
      totalTables,
    });
  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
};
