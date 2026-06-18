const prisma = require('../config/database');

exports.getRevenue = async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const establishmentId = req.establishmentId;
    const now = new Date();

    let startDate;
    let groupFormat;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        groupFormat = '%d.%m';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        groupFormat = '%d.%m';
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupFormat = '%m.%Y';
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = '%H:00';
    }

    const orders = await prisma.order.findMany({
      where: {
        table: { establishmentId },
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: {
        total: true,
        createdAt: true,
        paymentType: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByPeriod = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      let key;
      if (period === 'day') key = `${String(date.getHours()).padStart(2, '0')}:00`;
      else if (period === 'year') key = `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
      else key = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + order.total;
      return acc;
    }, {});

    const labels = Object.keys(revenueByPeriod);
    const data = Object.values(revenueByPeriod);
    const total = data.reduce((a, b) => a + b, 0);

    res.json({ labels, data, total, period });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Не удалось получить аналитику выручки' });
  }
};

exports.getPopularItems = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;
    const { limit = 10, from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          table: { establishmentId },
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      include: {
        menuItem: true,
      },
    });

    // Группировка по товарам
    const itemsMap = new Map();
    orderItems.forEach(item => {
      if (!item.menuItemId) return;
      const existing = itemsMap.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * (item.unitPrice || item.menuItem?.price || 0);
      } else {
        itemsMap.set(item.menuItemId, {
          id: item.menuItemId,
          name: item.menuItem?.name || 'Неизвестно',
          quantity: item.quantity,
          revenue: item.quantity * (item.unitPrice || item.menuItem?.price || 0),
        });
      }
    });

    const items = Array.from(itemsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, parseInt(limit));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsWithPercentage = items.map(item => ({
      ...item,
      percentage: totalQuantity > 0 ? Math.round((item.quantity / totalQuantity) * 100) : 0,
    }));

    res.json({ items: itemsWithPercentage });
  } catch (error) {
    console.error('Popular items error:', error);
    res.status(500).json({ error: 'Не удалось получить популярные блюда' });
  }
};

exports.getBusyHours = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;

    const orders = await prisma.order.findMany({
      where: {
        table: { establishmentId },
        status: { not: 'CANCELLED' },
      },
      select: { createdAt: true },
    });

    const hourCounts = Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    const labels = hourCounts.map((_, i) => `${String(i).padStart(2, '0')}:00`);
    const data = hourCounts;

    res.json({ labels, data });
  } catch (error) {
    console.error('Busy hours error:', error);
    res.status(500).json({ error: 'Не удалось получить загруженность' });
  }
};

exports.getAverageCheck = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;
    const { period = 'day' } = req.query;

    const now = new Date();
    let startDate;
    if (period === 'week') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
    else if (period === 'month') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }
    else { startDate = new Date(now); startDate.setHours(0, 0, 0, 0); }

    const orders = await prisma.order.findMany({
      where: {
        table: { establishmentId },
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { total: true },
    });

    const total = orders.reduce((sum, o) => sum + o.total, 0);
    const averageCheck = orders.length > 0 ? total / orders.length : 0;

    res.json({ averageCheck, totalOrders: orders.length, totalRevenue: total, period });
  } catch (error) {
    console.error('Average check error:', error);
    res.status(500).json({ error: 'Не удалось получить средний чек' });
  }
};

exports.getOccupancyRate = async (req, res) => {
  try {
    const establishmentId = req.establishmentId;

    const [totalTables, occupiedTables, totalCapacity, reservations] = await Promise.all([
      prisma.restaurantTable.count({ where: { establishmentId } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'OCCUPIED' } }),
      prisma.restaurantTable.aggregate({ where: { establishmentId }, _sum: { capacity: true } }),
      prisma.reservation.count({
        where: {
          establishmentId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          reservedAt: { gte: new Date() },
        },
      }),
    ]);

    res.json({
      totalTables,
      occupiedTables,
      freeTables: totalTables - occupiedTables,
      occupancyRate: totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0,
      totalCapacity: totalCapacity._sum.capacity || 0,
      upcomingReservations: reservations,
    });
  } catch (error) {
    console.error('Occupancy rate error:', error);
    res.status(500).json({ error: 'Не удалось получить загрузку' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const establishmentId = req.establishmentId;

    const startDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const [orders, tables, shifts] = await Promise.all([
      prisma.order.findMany({
        where: {
          table: { establishmentId },
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          items: { include: { menuItem: true } },
          table: true,
        },
      }),
      prisma.restaurantTable.findMany({
        where: { establishmentId },
      }),
      prisma.shift.findMany({
        where: {
          establishmentId,
          openedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Расчет метрик
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    
    const cardRevenue = completedOrders
      .filter(o => o.paymentType === 'CARD')
      .reduce((sum, o) => sum + o.total, 0);
    
    const cashRevenue = completedOrders
      .filter(o => o.paymentType === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);
    
    const bonusRevenue = 0; // TODO: реализовать бонусную систему
    const totalDiscounts = 0; // TODO: реализовать скидки
    const totalBonuses = 0; // TODO: реализовать бонусы

    const totalGuests = orders.length * 2; // Примерное количество гостей
    const averageCheck = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const averageCheckPerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;

    // Фудкост (примерно 30%)
    const foodCost = 30;
    const margin = totalRevenue * 0.7;

    const pendingOrders = orders.filter(o => o.status === 'NEW').length;
    const openOrders = orders.filter(o => ['NEW', 'COOKING', 'READY'].includes(o.status)).length;
    const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
    const occupiedSeats = occupiedTables * 3; // Примерно
    const openShifts = shifts.filter(s => s.status === 'OPEN').length;

    res.json({
      totalRevenue,
      cardRevenue,
      cashRevenue,
      bonusRevenue,
      totalDiscounts,
      totalBonuses,
      totalOrders: orders.length,
      totalGuests,
      averageCheck,
      averageCheckPerGuest,
      margin,
      foodCost,
      pendingOrders,
      openOrders,
      occupiedTables,
      occupiedSeats,
      openShifts,
      totalShifts: shifts.length,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
};
