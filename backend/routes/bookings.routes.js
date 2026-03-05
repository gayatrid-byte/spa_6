const express = require('express');
const router = express.Router();

/* MIDDLEWARE */
const { authenticate, authorize } = require('../middleware/auth.middleware');

/* CONTROLLERS */
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getBookingsByCustomer,
  getBookingsByDate,
  checkAvailability
} = require('../controllers/bookings.controller');

/* ROLE ACCESS */
const staffAccess = authorize('owner', 'center', 'staff');

/* GLOBAL AUTH */
router.use(authenticate);

/* ================= BOOKING ROUTES ================= */

/* GET */
router.get('/', staffAccess, getAllBookings);
router.get('/date/:date', staffAccess, getBookingsByDate);
router.get('/customer/:customerId(\\d+)', staffAccess, getBookingsByCustomer);
router.get('/availability', staffAccess, checkAvailability);
router.get('/:id', staffAccess, getBookingById);

/* CREATE */
router.post('/', staffAccess, createBooking);

/* UPDATE */
router.put('/:id', staffAccess, updateBooking);

/* CANCEL */
router.patch('/:id/cancel', staffAccess, cancelBooking);

/* DELETE (Admin Only) */
router.delete('/:id', authorize('owner', 'center'), deleteBooking);

/* EXPORT ROUTER */
module.exports = router;