const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/revenue', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getRevenue);
router.get('/popular-items', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getPopularItems);
router.get('/busy-hours', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getBusyHours);
router.get('/average-check', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getAverageCheck);
router.get('/occupancy', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getOccupancyRate);
router.get('/dashboard', authenticate, authorize('ADMIN', 'MANAGER'), analyticsController.getDashboardStats);

module.exports = router;
