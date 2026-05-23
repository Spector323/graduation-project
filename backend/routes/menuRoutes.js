const express = require('express');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/categories', getAllCategories);
router.post('/categories', authorize('ADMIN', 'MANAGER'), createCategory);
router.put('/categories/:id', authorize('ADMIN', 'MANAGER'), updateCategory);
router.delete('/categories/:id', authorize('ADMIN', 'MANAGER'), deleteCategory);

router.get('/items', getAllMenuItems);
router.post('/items', authorize('ADMIN', 'MANAGER'), createMenuItem);
router.put('/items/:id', authorize('ADMIN', 'MANAGER'), updateMenuItem);
router.delete('/items/:id', authorize('ADMIN', 'MANAGER'), deleteMenuItem);

module.exports = router;
