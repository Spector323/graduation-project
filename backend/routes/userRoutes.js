const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getAllUsers);
router.post('/', authorize('ADMIN', 'MANAGER'), createUser);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateUser);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteUser);

module.exports = router;
