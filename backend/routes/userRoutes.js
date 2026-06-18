const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER', 'PLATFORM_OWNER'), getAllUsers);
router.post('/', authorize('ADMIN', 'MANAGER', 'PLATFORM_OWNER'), validate('createUser'), log('CREATE', 'USER'), createUser);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'PLATFORM_OWNER'), validate('updateUser'), log('UPDATE', 'USER'), updateUser);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'PLATFORM_OWNER'), log('DELETE', 'USER'), deleteUser);

module.exports = router;
