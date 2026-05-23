const prisma = require('../config/database');

// Menu Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.menuCategory.create({
      data: { name, description: description || '' },
    });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuCategory.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Menu Items
exports.getAllMenuItems = async (req, res) => {
  try {
    const { available, categoryId } = req.query;

    const where = {};
    if (available !== undefined) {
      where.available = available === 'true';
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, categoryId, imageUrl, available } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price,
        categoryId,
        imageUrl: imageUrl || '',
        available: available !== false,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, imageUrl, available } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(available !== undefined && { available }),
      },
      include: {
        category: true,
      },
    });

    res.json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({
      where: { id },
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
