const express = require('express');
const {
  getAllOrders, createOrder, updateOrderStatus, getOrderById, getDashboardStats,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getDashboardStats);
router.get('/', getAllOrders);
router.post('/', log('CREATE', 'ORDER'), createOrder);
router.get('/:id', getOrderById);
router.put('/:id/status', validate('updateOrderStatus'), log('UPDATE', 'ORDER_STATUS'), updateOrderStatus);
router.patch('/:id/status', validate('updateOrderStatus'), log('UPDATE', 'ORDER_STATUS'), updateOrderStatus);

module.exports = router;
