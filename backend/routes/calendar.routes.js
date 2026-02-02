const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All calendar routes require authentication
router.use(authenticate);

// Calendar views
router.get('/views/:viewType', calendarController.getCalendarView);

// Quick booking
router.post('/quick-book', calendarController.quickBook);

// Availability calculation
router.get('/availability', calendarController.getAvailability);

// Bulk operations
router.post('/bulk-update', calendarController.bulkUpdate);

// Analytics
router.get('/analytics', calendarController.getAnalytics);

// External calendar sync
router.post('/sync/external', authorize(['owner', 'center']), calendarController.syncExternalCalendar);

// Resource management
router.post('/resources', authorize(['owner', 'center']), calendarController.manageResources);

// Booking rules engine
router.post('/rules', authorize(['owner', 'center']), calendarController.manageBookingRules);

module.exports = router;