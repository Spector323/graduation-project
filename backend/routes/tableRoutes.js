const express = require('express');
const {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  getTableStats,
} = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getTableStats);
router.get('/', getAllTables);
router.post('/', authorize('ADMIN', 'MANAGER'), createTable);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateTable);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteTable);

module.exports = router;
