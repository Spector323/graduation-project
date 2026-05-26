const prisma = require('../config/database');

exports.getAllOrders = async (req, res) => {
  try {
    if (!req.establishmentId) {
      return res.status(400).json({ error: 'Заведение не определено' });
    }

    const { status, limit } = req.query;

    const where = { table: { establishmentId: req.establishmentId } };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: true,
        items: {
          include: {
            menuItem: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Не удалось загрузить заказы' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Заказ должен содержать хотя бы одну позицию' });
    }

    if (tableId) {
      const table = await prisma.restaurantTable.findFirst({
        where: { id: tableId, establishmentId: req.establishmentId },
      });
      if (!table) {
        return res.status(400).json({ error: 'Стол не найден' });
      }
    }

    let total = 0;
    const orderItemsData = items.map((item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      total += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        notes: item.notes || '',
      };
    });

    const order = await prisma.order.create({
      data: {
        tableId: tableId || null,
        waiterId: req.userId,
        notes: notes || '',
        total,
        status: 'NEW',
        items: { create: orderItemsData },
      },
      include: {
        table: true,
        waiter: true,
        items: { include: { menuItem: true } },
      },
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Не удалось создать заказ' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentType } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentType && { paymentType }),
        ...(paymentType && { paid: true }),
      },
      include: {
        table: true,
        waiter: true,
        items: { include: { menuItem: true } },
      },
    });

    if (status === 'COMPLETED' && updated.tableId) {
      await prisma.restaurantTable.update({
        where: { id: updated.tableId },
        data: { status: 'FREE' },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Не удалось обновить заказ' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: true,
        items: {
          include: { menuItem: { include: { category: true } } },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Не удалось получить заказ' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereBase = { table: { establishmentId } };

    const [
      totalOrders,
      activeOrders,
      completedToday,
      totalRevenue,
      totalTables,
      occupiedTables,
    ] = await Promise.all([
      prisma.order.count({ where: whereBase }),
      prisma.order.count({
        where: { ...whereBase, status: { in: ['NEW', 'COOKING', 'READY'] } },
      }),
      prisma.order.count({
        where: {
          ...whereBase,
          status: 'COMPLETED',
          createdAt: { gte: today },
        },
      }),
      prisma.order.aggregate({
        where: { ...whereBase, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.restaurantTable.count({ where: { establishmentId } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'OCCUPIED' } }),
    ]);

    res.json({
      totalOrders,
      activeOrders,
      completedToday,
      totalRevenue: totalRevenue._sum.total || 0,
      totalTables,
      occupiedTables,
      freeTables: totalTables - occupiedTables,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
};
