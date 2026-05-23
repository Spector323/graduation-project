const express = require('express');
const {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  getOrderById,
  getDashboardStats,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getDashboardStats);
router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
