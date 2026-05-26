const express = require('express');
const {
  create,
  getCurrent,
  update,
  getTypes,
} = require('../controllers/establishmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/types', getTypes);
router.post('/', authenticate, create);
router.get('/current', authenticate, getCurrent);
router.put('/', authenticate, authorize('ADMIN', 'MANAGER'), update);

module.exports = router;
