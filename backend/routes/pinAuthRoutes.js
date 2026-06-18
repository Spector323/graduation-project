const express = require('express');
const router = express.Router();
const {
  setPinCode,
  authenticateWithPin,
  getUsersWithPin,
  deletePinCode,
  getPlainPinCode,
} = require('../controllers/pinAuthController');
const { authenticate } = require('../middleware/auth');

router.post('/auth', authenticateWithPin);

router.use(authenticate);

router.post('/:userId/set-pin', setPinCode);
router.delete('/:userId/delete-pin', deletePinCode);
router.get('/users', getUsersWithPin);
router.post('/show', getPlainPinCode);

module.exports = router;
