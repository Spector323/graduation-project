const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.post('/register', validate('register'), log('REGISTER', 'USER'), register);
router.post('/login', validate('login'), login);
router.get('/profile', authenticate, getProfile);

module.exports = router;
