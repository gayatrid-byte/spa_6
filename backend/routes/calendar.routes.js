// /**
//  * Calendar Pro v5 - Routes (ADAPTED to Existing Database)
//  * API endpoints for calendar operations
//  */

// const express = require('express');
// const router = express.Router();
// const calendarController = require('../controllers/calendar.controller');
// const calendarMiddleware = require('../middleware/calendar.middleware');
// const authMiddleware = require('../middleware/auth.middleware');

// // ==================== EVENT ROUTES ====================

// /**
//  * GET /api/calendar/events
//  * Get all calendar events with optional filters
//  * Query params: start, end, staff_id, room_id, customer_id, status, event_type, search
//  */
// router.get('/events', 
//     authMiddleware.authenticate,
//     calendarController.getEvents
// );

// /**
//  * GET /api/calendar/events/:id
//  * Get single event by ID
//  */
// router.get('/events/:id',
//     authMiddleware.authenticate,
//     calendarMiddleware.validateEventAccess,
//     calendarController.getEventById
// );

// /**
//  * POST /api/calendar/events
//  * Create new calendar event
//  */
// router.post('/events',
//     authMiddleware.authenticate,
//     calendarMiddleware.canCreateEvents,
//     calendarMiddleware.validateBookingTime,
//     calendarMiddleware.validateEventType,
//     calendarMiddleware.checkBusinessHours,
//     calendarMiddleware.checkServiceRequirements,
//     calendarMiddleware.checkAllAvailability,
//     calendarController.createEvent
// );

// /**
//  * PUT /api/calendar/events/:id
//  * Update calendar event
//  */
// router.put('/events/:id',
//     authMiddleware.authenticate,
//     calendarMiddleware.validateEventAccess,
//     calendarMiddleware.validateBookingTime,
//     calendarMiddleware.validateStatusTransition,
//     calendarMiddleware.checkBusinessHours,
//     calendarMiddleware.checkAllAvailability,
//     calendarController.updateEvent
// );

// /**
//  * DELETE /api/calendar/events/:id
//  * Delete calendar event
//  */
// router.delete('/events/:id',
//     authMiddleware.authenticate,
//     calendarMiddleware.canDeleteEvents,
//     calendarController.deleteEvent
// );

// /**
//  * PATCH /api/calendar/events/:id/status
//  * Update event status
//  */
// router.patch('/events/:id/status',
//     authMiddleware.authenticate,
//     calendarMiddleware.validateEventAccess,
//     calendarMiddleware.validateStatusTransition,
//     calendarController.updateEventStatus
// );

// // ==================== AVAILABILITY ROUTES ====================

// /**
//  * GET /api/calendar/availability
//  * Check availability for a time slot
//  * Query params: staff_id, room_id, booking_date, start_time, end_time
//  */
// router.get('/availability',
//     authMiddleware.authenticate,
//     calendarController.checkAvailability
// );

// // ==================== RESOURCES ROUTES ====================

// /**
//  * GET /api/calendar/resources
//  * Get calendar resources (staff, rooms, services, customers)
//  */
// router.get('/resources',
//     authMiddleware.authenticate,
//     calendarController.getResources
// );

// // ==================== STAFF EXCEPTIONS ROUTES ====================

// /**
//  * GET /api/calendar/staff-exceptions
//  * Get staff availability exceptions
//  * Query params: staff_id, start_date, end_date
//  */
// router.get('/staff-exceptions',
//     authMiddleware.authenticate,
//     calendarController.getStaffExceptions
// );

// /**
//  * POST /api/calendar/staff-exceptions
//  * Create staff availability exception
//  */
// router.post('/staff-exceptions',
//     authMiddleware.authenticate,
//     calendarMiddleware.checkCalendarPermission('center'),
//     calendarMiddleware.validateBookingTime,
//     calendarController.createStaffException
// );

// // ==================== STATISTICS ROUTES ====================

// /**
//  * GET /api/calendar/stats/today
//  * Get today's calendar statistics
//  */
// router.get('/stats/today',
//     authMiddleware.authenticate,
//     calendarController.getTodayStats
// );

// /**
//  * GET /api/calendar/stats/available-staff
//  * Get available staff count for a date
//  * Query params: date
//  */
// router.get('/stats/available-staff',
//     authMiddleware.authenticate,
//     calendarController.getAvailableStaffCount
// );

// // ==================== SETTINGS ROUTES ====================

// /**
//  * GET /api/calendar/settings
//  * Get calendar settings
//  */
// router.get('/settings',
//     authMiddleware.authenticate,
//     calendarController.getCalendarSettings
// );

// /**
//  * PUT /api/calendar/settings
//  * Update calendar setting
//  */
// router.put('/settings',
//     authMiddleware.authenticate,
//     calendarMiddleware.checkCalendarPermission('center'),
//     calendarController.updateCalendarSetting
// );

// // ==================== SYNC ROUTES ====================

// /**
//  * POST /api/calendar/sync/bookings
//  * Sync existing bookings to calendar events
//  */
// router.post('/sync/bookings',
//     authMiddleware.authenticate,
//     calendarMiddleware.checkCalendarPermission('owner'),
//     async (req, res) => {
//         try {
//             const db = require('../config/database');
            
//             // Call the stored procedure
//             await db.query('CALL sync_bookings_to_calendar()');
            
//             res.json({
//                 success: true,
//                 message: 'Bookings synced to calendar successfully'
//             });
//         } catch (error) {
//             console.error('Error syncing bookings:', error);
//             res.status(500).json({ 
//                 success: false, 
//                 error: error.message 
//             });
//         }
//     }
// );

// /**
//  * GET /api/calendar/bookings-without-events
//  * Get bookings that don't have calendar events
//  */
// router.get('/bookings-without-events',
//     authMiddleware.authenticate,
//     calendarMiddleware.checkCalendarPermission('owner'),
//     async (req, res) => {
//         try {
//             const db = require('../config/database');
            
//             const [rows] = await db.query(
//                 `SELECT * FROM v_bookings_without_calendar_events LIMIT 100`
//             );
            
//             res.json({ success: true, data: rows });
//         } catch (error) {
//             console.error('Error getting bookings without events:', error);
//             res.status(500).json({ 
//                 success: false, 
//                 error: error.message 
//             });
//         }
//     }
// );

// module.exports = router;

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================
// APPLY AUTHENTICATION TO ALL ROUTES
// Once token is verified, user gets FULL UNLIMITED ACCESS
// ============================================
router.use(authMiddleware.authenticate);

// All routes below require valid token only - NO ROLE RESTRICTIONS
// Users with valid tokens have complete access to all calendar operations

// Calendar Events - Full CRUD operations
router.get('/events', calendarController.getEvents);
router.post('/events', calendarController.createEvent);
router.put('/events/:id', calendarController.updateEvent); // drag/drop
router.delete('/events/:id', calendarController.deleteEvent);

// Availability - Full access
router.get('/availability', calendarController.checkAvailability);

// Dropdown resources - Full access
router.get('/resources', calendarController.getResources);

// Dashboard stats - Full access
router.get('/stats/today', calendarController.getTodayStats);

module.exports = router;