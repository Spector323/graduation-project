const express = require('express');
const {
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getTodayReservations,
} = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/today', getTodayReservations);
router.get('/', getAllReservations);
router.post('/', createReservation);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateReservation);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteReservation);

module.exports = router;
