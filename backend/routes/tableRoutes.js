const express = require('express');
const {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  getTableStats,
} = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getTableStats);
router.get('/', getAllTables);
router.post('/', authorize('ADMIN', 'MANAGER'), validate('createTable'), log('CREATE', 'TABLE'), createTable);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate('updateTable'), log('UPDATE', 'TABLE'), updateTable);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), log('DELETE', 'TABLE'), deleteTable);

module.exports = router;
