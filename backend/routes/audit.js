const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

router.use(authenticate);

router.get('/', auditController.getLogs);
router.get('/entity/:entity/:id', auditController.getLogsByEntity);
router.get('/stats', auditController.getStats);

module.exports = router;
