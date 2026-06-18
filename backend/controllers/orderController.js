const prisma = require('../config/database');
const { emitToEstablishment } = require('../socket');

// ==================== ЗАКАЗЫ ====================

exports.getAllOrders = async (req, res) => {
  try {
    if (!req.establishmentId) {
      return res.status(400).json({ error: 'Заведение не определено' });
    }
    const { status, limit } = req.query;
    const where = { table: { establishmentId: req.establishmentId } };
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = { in: status.split(',') };
      }
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
    const { tableId, items, notes, status: initialStatus, paymentType: initialPayment } = req.body;

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
    const orderItemsData = [];
    const ingredientsToDeduct = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { recipe: { include: { ingredient: true } } },
      });
      if (!menuItem) {
        return res.status(404).json({ error: `Блюдо не найдено: ${item.menuItemId}` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ error: `Блюдо "${menuItem.name}" недоступно` });
      }

      let itemPrice = menuItem.price;
      const unitPrice = itemPrice;

      const qty = item.quantity || 1;
      const itemTotal = itemPrice * qty;
      total += itemTotal;

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: qty,
        notes: item.notes || '',
      });

      // Собираем данные для списания ингредиентов
      if (menuItem.recipe && menuItem.recipe.length > 0) {
        for (const recipeItem of menuItem.recipe) {
          const requiredAmount = recipeItem.quantity * qty;
          ingredientsToDeduct.push({
            ingredientId: recipeItem.ingredientId,
            amount: requiredAmount,
            ingredientName: recipeItem.ingredient?.name,
            menuItemName: menuItem.name,
            unit: recipeItem.ingredient?.unit,
          });
        }
      }
    }

    // ПРОВЕРКА ОСТАТКОВ
    for (const ing of ingredientsToDeduct) {
      const currentIngredient = await prisma.ingredient.findUnique({
        where: { id: ing.ingredientId },
      });
      if (!currentIngredient || currentIngredient.stock < ing.amount) {
        return res.status(400).json({
          error: `Недостаточно ингредиента "${ing.ingredientName}" для блюда "${ing.menuItemName}". Нужно: ${ing.amount} ${ing.unit}, есть: ${currentIngredient?.stock || 0} ${ing.unit}`,
        });
      }
    }

    // СОЗДАНИЕ ЗАКАЗА + СПИСАНИЕ В ТРАНЗАКЦИИ
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: tableId || null,
          waiterId: req.userId,
          notes: notes || '',
          total,
          status: initialStatus || 'NEW',
          paymentType: initialPayment || null,
          paid: !!initialPayment,
          items: { create: orderItemsData },
        },
        include: {
          table: true, waiter: true,
          items: { include: { menuItem: { include: { category: true } } } },
        },
      });

      // Списываем ингредиенты
      for (const ing of ingredientsToDeduct) {
        await tx.ingredient.update({
          where: { id: ing.ingredientId },
          data: { stock: { decrement: ing.amount } },
        });
      }

      return newOrder;
    });

    // Обновляем статус стола
    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
      emitToEstablishment(req.establishmentId, 'table:updated', { id: tableId, status: 'OCCUPIED' });
    }

    emitToEstablishment(req.establishmentId, 'order:created', order);
    emitToEstablishment(req.establishmentId, 'inventory:updated', { type: 'ingredients_deducted', items: ingredientsToDeduct });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Не удалось создать заказ' });
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
        table: true, waiter: true,
        items: { include: { menuItem: { include: { category: true } } } },
      },
    });

    if (status === 'COMPLETED' && updated.tableId) {
      await prisma.restaurantTable.update({
        where: { id: updated.tableId },
        data: { status: 'FREE' },
      });
      emitToEstablishment(req.establishmentId, 'table:updated', { id: updated.tableId, status: 'FREE' });
    }

    emitToEstablishment(req.establishmentId, 'order:updated', updated);
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
        table: true, waiter: true,
        items: {
          include: { menuItem: { include: { category: true } } },
        },
      },
    });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
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
      totalOrders, activeOrders, completedToday, totalRevenue,
      totalTables, occupiedTables,
    ] = await Promise.all([
      prisma.order.count({ where: whereBase }),
      prisma.order.count({ where: { ...whereBase, status: { in: ['NEW', 'COOKING', 'READY'] } } }),
      prisma.order.count({ where: { ...whereBase, status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { ...whereBase, status: 'COMPLETED' }, _sum: { total: true } }),
      prisma.restaurantTable.count({ where: { establishmentId } }),
      prisma.restaurantTable.count({ where: { establishmentId, status: 'OCCUPIED' } }),
    ]);

    // Фудкост (приближённо: 30% от выручки)
    const foodCostEstimate = (totalRevenue._sum.total || 0) * 0.3;

    res.json({
      totalOrders,
      activeOrders,
      completedToday,
      totalRevenue: totalRevenue._sum.total || 0,
      estimatedFoodCost: foodCostEstimate,
      estimatedProfit: (totalRevenue._sum.total || 0) - foodCostEstimate,
      totalTables,
      occupiedTables,
      freeTables: totalTables - occupiedTables,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { tableId, items, notes, status: initialStatus, paymentType: initialPayment } = req.body;

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

    const effectiveStatus = initialStatus || 'NEW';

    const order = await prisma.order.create({
      data: {
        tableId: tableId || null,
        waiterId: req.userId,
        notes: notes || '',
        total,
        status: effectiveStatus,
        paymentType: initialPayment || null,
        paid: !!initialPayment,
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

    emitToEstablishment(req.establishmentId, 'order:created', order);
    if (tableId) {
      emitToEstablishment(req.establishmentId, 'table:updated', { id: tableId, status: 'OCCUPIED' });
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

    emitToEstablishment(req.establishmentId, 'order:updated', updated);
    if (status === 'COMPLETED' && updated.tableId) {
      emitToEstablishment(req.establishmentId, 'table:updated', { id: updated.tableId, status: 'FREE' });
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
