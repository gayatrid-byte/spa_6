const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  searchCustomers,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  checkAvailability,
  getAvailableSlots,
  getDashboardStats
} = require('../controllers/bookings.controller');

// Customer search
router.get('/customers/search', authenticate, searchCustomers);

// Booking routes
router.get('/', authenticate, getAllBookings);
router.get('/stats', authenticate, getDashboardStats);
router.get('/available-slots', authenticate, getAvailableSlots);
router.get('/check-availability', authenticate, checkAvailability);
router.get('/:id', authenticate, getBookingById);
router.post('/', authenticate, createBooking);
router.put('/:id', authenticate, updateBooking);
router.patch('/:id/status', authenticate, updateBookingStatus);
router.delete('/:id', authenticate, deleteBooking);

module.exports = router;