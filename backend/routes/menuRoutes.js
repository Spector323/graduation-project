const express = require('express');
const router = express.Router();
const {
  getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllIngredients, createIngredient, updateIngredient, updateIngredientStock, deleteIngredient,
  getRecipe, updateRecipe, getRecipeCost,
  getAllModifierGroups, createModifierGroup, updateModifierGroup, deleteModifierGroup,
  createModifier, updateModifier, deleteModifier,
} = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/categories', getAllCategories);
router.post('/categories', authorize('ADMIN', 'MANAGER'), createCategory);
router.put('/categories/:id', authorize('ADMIN', 'MANAGER'), updateCategory);
router.delete('/categories/:id', authorize('ADMIN', 'MANAGER'), deleteCategory);

router.get('/items', getAllMenuItems);
router.post('/items', authorize('ADMIN', 'MANAGER'), createMenuItem);
router.put('/items/:id', authorize('ADMIN', 'MANAGER'), updateMenuItem);
router.delete('/items/:id', authorize('ADMIN', 'MANAGER'), deleteMenuItem);

router.get('/ingredients', getAllIngredients);
router.post('/ingredients', authorize('ADMIN', 'MANAGER'), createIngredient);
router.put('/ingredients/:id', authorize('ADMIN', 'MANAGER'), updateIngredient);
router.patch('/ingredients/:id/stock', authorize('ADMIN', 'MANAGER'), updateIngredientStock);
router.delete('/ingredients/:id', authorize('ADMIN', 'MANAGER'), deleteIngredient);

router.get('/items/:menuItemId/recipe', getRecipe);
router.put('/items/:menuItemId/recipe', authorize('ADMIN', 'MANAGER'), updateRecipe);
router.get('/items/:menuItemId/recipe/cost', getRecipeCost);

// Modifier Groups
router.get('/modifier-groups', getAllModifierGroups);
router.post('/modifier-groups', authorize('ADMIN', 'MANAGER'), createModifierGroup);
router.put('/modifier-groups/:id', authorize('ADMIN', 'MANAGER'), updateModifierGroup);
router.delete('/modifier-groups/:id', authorize('ADMIN', 'MANAGER'), deleteModifierGroup);

// Modifiers
router.post('/modifiers', authorize('ADMIN', 'MANAGER'), createModifier);
router.put('/modifiers/:id', authorize('ADMIN', 'MANAGER'), updateModifier);
router.delete('/modifiers/:id', authorize('ADMIN', 'MANAGER'), deleteModifier);

module.exports = router;
