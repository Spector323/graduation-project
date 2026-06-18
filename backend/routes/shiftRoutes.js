const express = require('express');
const router = express.Router();
const {
  openShift,
  closeShift,
  getCurrentShift,
  getShifts,
} = require('../controllers/shiftController');
const { authenticate } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticate);

router.post('/open', openShift);
router.post('/:shiftId/close', closeShift);
router.get('/current', getCurrentShift);
router.get('/', getShifts);

module.exports = router;
