const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { platformOwner } = require('../middleware/platformAuth');
const platformController = require('../controllers/platformController');

router.use(authenticate);
router.use(platformOwner);

router.get('/establishments', platformController.getAllEstablishments);
router.get('/establishments/:id', platformController.getEstablishment);
router.post('/establishments', platformController.createEstablishment);
router.patch('/establishments/:id', platformController.updateEstablishment);
router.delete('/establishments/:id', platformController.deleteEstablishment);
router.get('/users', platformController.getAllUsers);
router.get('/stats', platformController.getPlatformStats);

module.exports = router;
