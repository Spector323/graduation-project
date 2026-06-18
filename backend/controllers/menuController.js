const prisma = require('../config/database');
const { emitToEstablishment } = require('../socket');

const getEstablishmentId = (req) => {
  if (req.establishmentId) return req.establishmentId;
  throw new Error('Р—Р°РІРµРґРµРЅРёРµ РЅРµ РѕРїСЂРµРґРµР»РµРЅРѕ');
};

// ==================== РљРђРўР•Р“РћР РР ====================

exports.getAllCategories = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const categories = await prisma.menuCategory.findMany({
      where: { establishmentId },
      include: { _count: { select: { menuItems: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєР°С‚РµРіРѕСЂРёРё' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'РќР°Р·РІР°РЅРёРµ РєР°С‚РµРіРѕСЂРёРё РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ' });
    const category = await prisma.menuCategory.create({
      data: { name, description: description || '', establishmentId },
    });
    emitToEstablishment(establishmentId, 'menu:category:created', category);
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'РљР°С‚РµРіРѕСЂРёСЏ СЃ С‚Р°РєРёРј РЅР°Р·РІР°РЅРёРµРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚' });
    console.error('Create category error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РєР°С‚РµРіРѕСЂРёСЋ' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await prisma.menuCategory.findFirst({ where: { id, establishmentId } });
    if (!category) return res.status(404).json({ error: 'РљР°С‚РµРіРѕСЂРёСЏ РЅРµ РЅР°Р№РґРµРЅР°' });
    const updated = await prisma.menuCategory.update({
      where: { id },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
    emitToEstablishment(establishmentId, 'menu:category:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const category = await prisma.menuCategory.findFirst({ where: { id, establishmentId } });
    if (!category) return res.status(404).json({ error: 'РљР°С‚РµРіРѕСЂРёСЏ РЅРµ РЅР°Р№РґРµРЅР°' });
    await prisma.menuCategory.delete({ where: { id } });
    emitToEstablishment(establishmentId, 'menu:category:deleted', { id });
    res.json({ message: 'РљР°С‚РµРіРѕСЂРёСЏ СѓРґР°Р»РµРЅР°' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ' });
  }
};

// ==================== Р‘Р›Р®Р”Рђ ====================

exports.getAllMenuItems = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { available, categoryId } = req.query;
    const where = { category: { establishmentId } };
    if (available !== undefined) where.available = available === 'true';
    if (categoryId) where.categoryId = categoryId;
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        recipe: { include: { ingredient: true } },
        modifierGroups: { include: { modifiers: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјРµРЅСЋ' });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, description, price, categoryId, imageUrl, available } = req.body;
    if (!name || price === undefined || price === null) return res.status(400).json({ error: 'Название и цена обязательны' });
    const menuItem = await prisma.menuItem.create({
      data: {
        name, description: description || '', price: parseFloat(price),
        categoryId, imageUrl: imageUrl || '', available: available !== false,
      },
      include: { category: true },
    });
    emitToEstablishment(establishmentId, 'menu:item:created', menuItem);
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р±Р»СЋРґРѕ' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, description, price, categoryId, imageUrl, available } = req.body;
    const menuItem = await prisma.menuItem.findFirst({ where: { id, category: { establishmentId } } });
    if (!menuItem) return res.status(404).json({ error: 'Блюдо не найдено' });
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }), ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }), ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl }), ...(available !== undefined && { available }),
      },
      include: { category: true },
    });
    emitToEstablishment(establishmentId, 'menu:item:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ Р±Р»СЋРґРѕ' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findFirst({ where: { id, category: { establishmentId } } });
    if (!menuItem) return res.status(404).json({ error: 'Р‘Р»СЋРґРѕ РЅРµ РЅР°Р№РґРµРЅРѕ' });
    await prisma.menuItem.delete({ where: { id } });
    emitToEstablishment(establishmentId, 'menu:item:deleted', { id });
    res.json({ message: 'Р‘Р»СЋРґРѕ СѓРґР°Р»РµРЅРѕ' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ Р±Р»СЋРґРѕ' });
  }
};

// ==================== РРќР“Р Р•Р”РР•РќРўР« ====================

exports.getAllIngredients = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const ingredients = await prisma.ingredient.findMany({
      where: { establishmentId }, orderBy: { name: 'asc' },
    });
    res.json(ingredients);
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РёРЅРіСЂРµРґРёРµРЅС‚С‹' });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, unit, costPerUnit, minStock, stock } = req.body;
    if (!name || !unit) return res.status(400).json({ error: 'РќР°Р·РІР°РЅРёРµ Рё РµРґРёРЅРёС†Р° РёР·РјРµСЂРµРЅРёСЏ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' });
    const ingredient = await prisma.ingredient.create({
      data: {
        name, unit, costPerUnit: parseFloat(costPerUnit) || 0,
        minStock: parseFloat(minStock) || 0, stock: parseFloat(stock) || 0, establishmentId,
      },
    });
    emitToEstablishment(establishmentId, 'inventory:updated', { type: 'ingredient_created' });
    res.status(201).json(ingredient);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'РРЅРіСЂРµРґРёРµРЅС‚ СЃ С‚Р°РєРёРј РЅР°Р·РІР°РЅРёРµРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚' });
    console.error('Create ingredient error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РёРЅРіСЂРµРґРёРµРЅС‚' });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findFirst({ where: { id, establishmentId } });
    if (!ingredient) return res.status(404).json({ error: 'РРЅРіСЂРµРґРёРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ' });
    const { name, unit, costPerUnit, minStock, stock } = req.body;
    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name && { name }), ...(unit && { unit }),
        ...(costPerUnit !== undefined && { costPerUnit: parseFloat(costPerUnit) }),
        ...(minStock !== undefined && { minStock: parseFloat(minStock) }),
        ...(stock !== undefined && { stock: parseFloat(stock) }),
      },
    });
    emitToEstablishment(establishmentId, 'inventory:updated', { type: 'ingredient_updated', ingredient: updated });
    res.json(updated);
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РёРЅРіСЂРµРґРёРµРЅС‚' });
  }
};

exports.updateIngredientStock = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { stock, operation } = req.body;
    const ingredient = await prisma.ingredient.findFirst({ where: { id, establishmentId } });
    if (!ingredient) return res.status(404).json({ error: 'РРЅРіСЂРµРґРёРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ' });
    let newStock = ingredient.stock;
    if (operation === 'set') newStock = parseFloat(stock);
    else if (operation === 'add') newStock += parseFloat(stock);
    else if (operation === 'subtract') newStock -= parseFloat(stock);
    if (newStock < 0) return res.status(400).json({ error: 'РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РЅР° СЃРєР»Р°РґРµ' });
    const updated = await prisma.ingredient.update({ where: { id }, data: { stock: newStock } });
    emitToEstablishment(establishmentId, 'inventory:updated', { ingredientId: id, stock: newStock });
    res.json(updated);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РѕСЃС‚Р°С‚РѕРє' });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findFirst({ where: { id, establishmentId } });
    if (!ingredient) return res.status(404).json({ error: 'РРЅРіСЂРµРґРёРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ' });
    await prisma.ingredient.delete({ where: { id } });
    emitToEstablishment(establishmentId, 'inventory:updated', { type: 'ingredient_deleted', ingredientId: id });
    res.json({ message: 'РРЅРіСЂРµРґРёРµРЅС‚ СѓРґР°Р»С‘РЅ' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РёРЅРіСЂРµРґРёРµРЅС‚' });
  }
};

// ==================== РўР•РҐРљРђР РўР« ====================

exports.getRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipeItem.findMany({
      where: { menuItemId: id }, include: { ingredient: true },
    });
    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‚РµС…РєР°СЂС‚Сѓ' });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { items } = req.body;
    const menuItem = await prisma.menuItem.findFirst({
      where: { id, category: { establishmentId } },
    });
    if (!menuItem) return res.status(404).json({ error: 'Р‘Р»СЋРґРѕ РЅРµ РЅР°Р№РґРµРЅРѕ' });
    await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { menuItemId: id } });
      if (items && items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map(item => ({
            menuItemId: id, ingredientId: item.ingredientId, quantity: parseFloat(item.quantity),
          })),
        });
      }
    });
    emitToEstablishment(establishmentId, 'menu:recipe:updated', { menuItemId: id });
    res.json({ message: 'РўРµС…РєР°СЂС‚Р° РѕР±РЅРѕРІР»РµРЅР°' });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ С‚РµС…РєР°СЂС‚Сѓ' });
  }
};

exports.getRecipeCost = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipeItem.findMany({
      where: { menuItemId: id }, include: { ingredient: true },
    });
    let totalCost = 0;
    const items = recipe.map(r => {
      const cost = r.quantity * (r.ingredient?.costPerUnit || 0);
      totalCost += cost;
      return {
        ingredientId: r.ingredientId, ingredientName: r.ingredient?.name,
        quantity: r.quantity, unit: r.ingredient?.unit,
        costPerUnit: r.ingredient?.costPerUnit || 0, cost,
      };
    });
    res.json({ items, totalCost });
  } catch (error) {
    console.error('Get recipe cost error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°СЃСЃС‡РёС‚Р°С‚СЊ СЃРµР±РµСЃС‚РѕРёРјРѕСЃС‚СЊ' });
  }
};

exports.getAllModifierGroups = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const groups = await prisma.modifierGroup.findMany({
      where: { establishmentId },
      include: { modifiers: true },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (error) {
    console.error('Get modifier groups error:', error);
    res.status(500).json({ error: 'Failed to load modifier groups' });
  }
};

exports.createModifierGroup = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { name, minSelect, maxSelect, modifiers } = req.body;
    if (!name) return res.status(400).json({ error: 'РќР°Р·РІР°РЅРёРµ РіСЂСѓРїРїС‹ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ' });
    const group = await prisma.modifierGroup.create({
      data: {
        name, minSelect: minSelect || 0, maxSelect: maxSelect || 1, establishmentId,
        modifiers: {
          create: modifiers ? modifiers.map(m => ({ name: m.name, price: parseFloat(m.price) || 0 })) : [],
        },
      },
      include: { modifiers: true },
    });
    emitToEstablishment(establishmentId, 'menu:modifiers:updated', group);
    res.status(201).json(group);
  } catch (error) {
    console.error('Create modifier group error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РіСЂСѓРїРїСѓ РјРѕРґРёС„РёРєР°С‚РѕСЂРѕРІ' });
  }
};

exports.updateModifierGroup = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, minSelect, maxSelect } = req.body;
    const group = await prisma.modifierGroup.findFirst({ where: { id, establishmentId } });
    if (!group) return res.status(404).json({ error: 'Р“СЂСѓРїРїР° РЅРµ РЅР°Р№РґРµРЅР°' });
    const updated = await prisma.modifierGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(minSelect !== undefined && { minSelect }),
        ...(maxSelect !== undefined && { maxSelect }),
      },
      include: { modifiers: true },
    });
    emitToEstablishment(establishmentId, 'menu:modifiers:updated', updated);
    res.json(updated);
  } catch (error) {
    console.error('Update modifier group error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РіСЂСѓРїРїСѓ РјРѕРґРёС„РёРєР°С‚РѕСЂРѕРІ' });
  }
};

exports.deleteModifierGroup = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const group = await prisma.modifierGroup.findFirst({ where: { id, establishmentId } });
    if (!group) return res.status(404).json({ error: 'Р“СЂСѓРїРїР° РЅРµ РЅР°Р№РґРµРЅР°' });
    await prisma.modifierGroup.delete({ where: { id } });
    emitToEstablishment(establishmentId, 'menu:modifiers:deleted', { id });
    res.json({ message: 'Р“СЂСѓРїРїР° РјРѕРґРёС„РёРєР°С‚РѕСЂРѕРІ СѓРґР°Р»РµРЅР°' });
  } catch (error) {
    console.error('Delete modifier group error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РіСЂСѓРїРїСѓ РјРѕРґРёС„РёРєР°С‚РѕСЂРѕРІ' });
  }
};

exports.createModifier = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { groupId, name, price } = req.body;
    const group = await prisma.modifierGroup.findFirst({ where: { id: groupId, establishmentId } });
    if (!group) return res.status(404).json({ error: 'Р“СЂСѓРїРїР° РЅРµ РЅР°Р№РґРµРЅР°' });
    const modifier = await prisma.modifier.create({
      data: { name, price: parseFloat(price) || 0, groupId },
    });
    emitToEstablishment(establishmentId, 'menu:modifiers:updated', { type: 'modifier_created', modifier });
    res.status(201).json(modifier);
  } catch (error) {
    console.error('Create modifier error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РјРѕРґРёС„РёРєР°С‚РѕСЂ' });
  }
};

exports.updateModifier = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const { name, price } = req.body;
    const modifier = await prisma.modifier.findUnique({ where: { id } });
    if (!modifier) return res.status(404).json({ error: 'РњРѕРґРёС„РёРєР°С‚РѕСЂ РЅРµ РЅР°Р№РґРµРЅ' });
    const group = await prisma.modifierGroup.findFirst({ where: { id: modifier.groupId, establishmentId } });
    if (!group) return res.status(404).json({ error: 'Р“СЂСѓРїРїР° РЅРµ РЅР°Р№РґРµРЅР°' });
    const updated = await prisma.modifier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
      },
    });
    emitToEstablishment(establishmentId, 'menu:modifiers:updated', { type: 'modifier_updated', modifier: updated });
    res.json(updated);
  } catch (error) {
    console.error('Update modifier error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РјРѕРґРёС„РёРєР°С‚РѕСЂ' });
  }
};

exports.deleteModifier = async (req, res) => {
  try {
    const establishmentId = getEstablishmentId(req);
    const { id } = req.params;
    const modifier = await prisma.modifier.findUnique({ where: { id } });
    if (!modifier) return res.status(404).json({ error: 'РњРѕРґРёС„РёРєР°С‚РѕСЂ РЅРµ РЅР°Р№РґРµРЅ' });
    const group = await prisma.modifierGroup.findFirst({ where: { id: modifier.groupId, establishmentId } });
    if (!group) return res.status(404).json({ error: 'Р“СЂСѓРїРїР° РЅРµ РЅР°Р№РґРµРЅР°' });
    await prisma.modifier.delete({ where: { id } });
    emitToEstablishment(establishmentId, 'menu:modifiers:updated', { type: 'modifier_deleted', modifierId: id });
    res.json({ message: 'РњРѕРґРёС„РёРєР°С‚РѕСЂ СѓРґР°Р»С‘РЅ' });
  } catch (error) {
    console.error('Delete modifier error:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РјРѕРґРёС„РёРєР°С‚РѕСЂ' });
  }
};

