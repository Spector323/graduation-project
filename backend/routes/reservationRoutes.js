const express = require('express');
const {
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getTodayReservations,
} = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { log } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

router.get('/today', getTodayReservations);
router.get('/', getAllReservations);
router.post('/', validate('createReservation'), log('CREATE', 'RESERVATION'), createReservation);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate('updateReservation'), log('UPDATE', 'RESERVATION'), updateReservation);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), log('DELETE', 'RESERVATION'), deleteReservation);

module.exports = router;
