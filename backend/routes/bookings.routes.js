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
  updateBookingStatus,
  deleteBooking,
  checkAvailability,
  getAvailableSlots,
  searchCustomers,
  getDashboardStats
} = require('../controllers/bookings.controller');

/* ROLE ACCESS */
const staffAccess = authorize('owner', 'center', 'staff');

/* GLOBAL AUTH */
router.use(authenticate);

/* ================= BOOKING ROUTES ================= */

/* GET */
router.get('/stats', staffAccess, getDashboardStats);
router.get('/', staffAccess, getAllBookings);
router.get('/availability', staffAccess, checkAvailability);
router.get('/slots', staffAccess, getAvailableSlots);
router.get('/customers/search', staffAccess, searchCustomers);
router.get('/:id', staffAccess, getBookingById);

/* CREATE */
router.post('/', staffAccess, createBooking);

/* UPDATE */
router.put('/:id', staffAccess, updateBooking);

/* STATUS UPDATE (cancel, complete, etc.) */
router.patch('/:id/status', staffAccess, updateBookingStatus);

/* DELETE (Admin Only) */
router.delete('/:id', authorize('owner', 'center'), deleteBooking);

/* EXPORT ROUTER */
module.exports = router;