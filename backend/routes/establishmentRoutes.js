const express = require('express');
const {
  create,
  getCurrent,
  update,
  getTypes,
  getAll,
} = require('../controllers/establishmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.get('/types', getTypes);
router.get('/', getAll);
router.post('/', authenticate, validate('createEstablishment'), log('CREATE', 'ESTABLISHMENT'), create);
router.get('/current', authenticate, getCurrent);
router.put('/', authenticate, authorize('ADMIN', 'MANAGER'), log('UPDATE', 'ESTABLISHMENT'), update);

module.exports = router;
