const prisma = require('../config/database');

const getEstablishmentId = (req) => {
  if (req.establishmentId) return req.establishmentId;
  throw new Error('Заведение не определено');
};

exports.getAllCategories = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);

    const categories = await prisma.menuCategory.findMany({
      where: { establishmentId },
      include: {
        _count: { select: { menuItems: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Не удалось загрузить категории' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const category = await prisma.menuCategory.create({
      data: { name, description: description || '', establishmentId },
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Категория с таким названием уже существует' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Не удалось создать категорию' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.menuCategory.findFirst({
      where: { id, establishmentId },
    });
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Не удалось обновить категорию' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;

    const category = await prisma.menuCategory.findFirst({
      where: { id, establishmentId },
    });
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    await prisma.menuCategory.delete({ where: { id } });
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Не удалось удалить категорию' });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { available, categoryId } = req.query;

    const where = { category: { establishmentId } };
    if (available !== undefined) {
      where.available = available === 'true';
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Не удалось загрузить меню' });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, description, price, categoryId, imageUrl, available } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        error: 'Название и цена обязательны',
      });
    }

    if (categoryId) {
      const category = await prisma.menuCategory.findFirst({
        where: { id: categoryId, establishmentId },
      });
      if (!category) {
        return res.status(400).json({ error: 'Категория не найдена' });
      }
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        categoryId,
        imageUrl: imageUrl || '',
        available: available !== false,
      },
      include: { category: true },
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Не удалось создать блюдо' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, description, price, categoryId, imageUrl, available } = req.body;

    const menuItem = await prisma.menuItem.findFirst({
      where: { id, category: { establishmentId } },
    });
    if (!menuItem) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(available !== undefined && { available }),
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Не удалось обновить блюдо' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;

    const menuItem = await prisma.menuItem.findFirst({
      where: { id, category: { establishmentId } },
    });
    if (!menuItem) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }

    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Блюдо удалено' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Не удалось удалить блюдо' });
  }
};
