const prisma = require('../config/database');

exports.getAllOrders = async (req, res) => {
  try {
    const { status, limit } = req.query;

    const where = {};
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
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    let total = 0;
    const orderItemsData = items.map((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.price,
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
        items: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        waiter: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentType } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentType && { paymentType }),
        ...(paymentType && { paid: true }),
      },
      include: {
        table: true,
        waiter: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (status === 'COMPLETED' && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'FREE' },
      });
    }

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      activeOrders,
      completedToday,
      totalRevenue,
      totalTables,
      occupiedTables,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['NEW', 'COOKING', 'READY'] } } }),
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today },
        },
      }),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.restaurantTable.count(),
      prisma.restaurantTable.count({ where: { status: 'OCCUPIED' } }),
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
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
