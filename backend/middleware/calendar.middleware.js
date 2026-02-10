// /**
//  * Calendar Pro v5 - Middleware (ADAPTED to Existing Database)
//  * Validation, availability checking, permissions
//  */

// const CalendarModel = require('../models/calendar.model');

// // ==================== VALIDATION MIDDLEWARE ====================

// /**
//  * Validate booking time and date
//  */
// function validateBookingTime(req, res, next) {
//     try {
//         const { booking_date, start_time, end_time } = req.body;
        
//         if (!booking_date || !start_time) {
//             return res.status(400).json({ 
//                 error: 'booking_date and start_time are required' 
//             });
//         }
        
//         // Validate date format
//         const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//         if (!dateRegex.test(booking_date)) {
//             return res.status(400).json({ 
//                 error: 'Invalid booking_date format. Use YYYY-MM-DD' 
//             });
//         }
        
//         // Validate time format
//         const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//         if (!timeRegex.test(start_time)) {
//             return res.status(400).json({ 
//                 error: 'Invalid start_time format. Use HH:MM' 
//             });
//         }
        
//         if (end_time && !timeRegex.test(end_time)) {
//             return res.status(400).json({ 
//                 error: 'Invalid end_time format. Use HH:MM' 
//             });
//         }
        
//         // Check if date is valid
//         const bookingDate = new Date(booking_date);
//         if (isNaN(bookingDate.getTime())) {
//             return res.status(400).json({ 
//                 error: 'Invalid booking_date value' 
//             });
//         }
        
//         // Check if start_time is before end_time
//         if (end_time) {
//             const startTimeParts = start_time.split(':');
//             const endTimeParts = end_time.split(':');
            
//             const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
//             const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
            
//             if (startMinutes >= endMinutes) {
//                 return res.status(400).json({ 
//                     error: 'start_time must be before end_time' 
//                 });
//             }
//         }
        
//         // Check minimum booking notice (1 hour)
//         const now = new Date();
//         const minBookingDate = new Date(now.getTime() + (60 * 60 * 1000));
//         const bookingDateTime = new Date(`${booking_date} ${start_time}`);
        
//         if (bookingDateTime < minBookingDate) {
//             return res.status(400).json({ 
//                 error: 'Bookings must be made at least 1 hour in advance' 
//             });
//         }
        
//         // Check maximum booking days ahead (90 days)
//         const maxBookingDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
//         if (bookingDateTime > maxBookingDate) {
//             return res.status(400).json({ 
//                 error: 'Bookings can only be made up to 90 days in advance' 
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error validating booking time:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Validate event status transition
//  */
// function validateStatusTransition(req, res, next) {
//     try {
//         const { status } = req.body;
        
//         if (!status) {
//             return next(); // No status change
//         }
        
//         const validStatuses = ['pending', 'confirmed', 'in_service', 'completed', 'cancelled', 'no_show'];
        
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ 
//                 error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
//             });
//         }
        
//         // Validate status transitions
//         const validTransitions = {
//             'pending': ['confirmed', 'cancelled', 'no_show'],
//             'confirmed': ['pending', 'in_service', 'cancelled'],
//             'in_service': ['confirmed', 'completed', 'cancelled'],
//             'completed': [],
//             'cancelled': [],
//             'no_show': []
//         };
        
//         // If updating existing event, check transition validity
//         if (req.params.id) {
//             CalendarModel.getEventById(req.params.id)
//                 .then(event => {
//                     if (event) {
//                         const allowedTransitions = validTransitions[event.status] || [];
//                         if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
//                             return res.status(400).json({ 
//                                 error: `Cannot transition from ${event.status} to ${status}. Allowed: ${allowedTransitions.join(', ')}` 
//                             });
//                         }
//                     }
//                     next();
//                 })
//                 .catch(err => {
//                     next(); // Proceed if we can't get current status
//                 });
//         } else {
//             next();
//         }
//     } catch (error) {
//         console.error('Error validating status transition:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Validate event type
//  */
// function validateEventType(req, res, next) {
//     try {
//         const { event_type } = req.body;
        
//         if (!event_type) {
//             return next(); // No event_type specified, default will be applied
//         }
        
//         const validEventTypes = ['booking', 'block', 'leave', 'break', 'training', 'meeting', 'maintenance'];
        
//         if (!validEventTypes.includes(event_type)) {
//             return res.status(400).json({ 
//                 error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` 
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error validating event type:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// // ==================== AVAILABILITY MIDDLEWARE ====================

// /**
//  * Check staff availability
//  */
// async function checkStaffAvailability(req, res, next) {
//     try {
//         const { staff_id, booking_date, start_time, end_time } = req.body;
        
//         if (!staff_id) {
//             return next(); // No staff specified, skip check
//         }
        
//         if (!booking_date || !start_time) {
//             return res.status(400).json({ 
//                 error: 'booking_date and start_time are required to check staff availability' 
//             });
//         }
        
//         const eventId = req.params.id || null;
//         const endTime = end_time || start_time; // Default to 30 min if not specified
        
//         const isAvailable = await CalendarModel.isStaffAvailable(
//             staff_id,
//             booking_date,
//             start_time,
//             endTime,
//             eventId
//         );
        
//         if (!isAvailable) {
//             return res.status(409).json({ 
//                 error: 'Staff is not available during this time slot',
//                 conflict_type: 'staff',
//                 code: 'STAFF_CONFLICT'
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking staff availability:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Check room availability
//  */
// async function checkRoomAvailability(req, res, next) {
//     try {
//         const { room_id, booking_date, start_time, end_time } = req.body;
        
//         if (!room_id) {
//             return next(); // No room specified, skip check
//         }
        
//         if (!booking_date || !start_time) {
//             return res.status(400).json({ 
//                 error: 'booking_date and start_time are required to check room availability' 
//             });
//         }
        
//         const eventId = req.params.id || null;
//         const endTime = end_time || start_time;
        
//         const isAvailable = await CalendarModel.isRoomAvailable(
//             room_id,
//             booking_date,
//             start_time,
//             endTime,
//             eventId
//         );
        
//         if (!isAvailable) {
//             return res.status(409).json({ 
//                 error: 'Room is not available during this time slot',
//                 conflict_type: 'room',
//                 code: 'ROOM_CONFLICT'
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking room availability:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Check all availability (staff and room)
//  */
// async function checkAllAvailability(req, res, next) {
//     try {
//         const { staff_id, room_id, booking_date, start_time, end_time } = req.body;
        
//         if (!booking_date || !start_time) {
//             return next();
//         }
        
//         const eventId = req.params.id || null;
//         const endTime = end_time || start_time;
        
//         const conflicts = [];
        
//         // Check staff availability
//         if (staff_id) {
//             const isStaffAvailable = await CalendarModel.isStaffAvailable(
//                 staff_id,
//                 booking_date,
//                 start_time,
//                 endTime,
//                 eventId
//             );
            
//             if (!isStaffAvailable) {
//                 conflicts.push({
//                     type: 'staff',
//                     message: 'Staff is not available during this time slot'
//                 });
//             }
//         }
        
//         // Check room availability
//         if (room_id) {
//             const isRoomAvailable = await CalendarModel.isRoomAvailable(
//                 room_id,
//                 booking_date,
//                 start_time,
//                 endTime,
//                 eventId
//             );
            
//             if (!isRoomAvailable) {
//                 conflicts.push({
//                     type: 'room',
//                     message: 'Room is not available during this time slot'
//                 });
//             }
//         }
        
//         if (conflicts.length > 0) {
//             return res.status(409).json({ 
//                 error: 'Availability conflicts detected',
//                 conflicts: conflicts,
//                 code: 'AVAILABILITY_CONFLICT'
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking availability:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// // ==================== PERMISSION MIDDLEWARE ====================

// /**
//  * Check calendar permissions based on user role
//  */
// function checkCalendarPermission(requiredRole) {
//     return (req, res, next) => {
//         try {
//             const userRole = req.user?.role;
            
//             // Role hierarchy: owner > center > staff
//             const roleHierarchy = {
//                 'owner': 3,
//                 'center': 2,
//                 'staff': 1
//             };
            
//             const userLevel = roleHierarchy[userRole] || 0;
//             const requiredLevel = roleHierarchy[requiredRole] || 0;
            
//             if (userLevel < requiredLevel) {
//                 return res.status(403).json({ 
//                     error: `Insufficient permissions. Required role: ${requiredRole}` 
//                 });
//             }
            
//             next();
//         } catch (error) {
//             console.error('Error checking calendar permission:', error);
//             res.status(500).json({ error: error.message });
//         }
//     };
// }

// /**
//  * Validate event access (owner or staff assigned)
//  */
// async function validateEventAccess(req, res, next) {
//     try {
//         const eventId = req.params.id || req.body.event_id;
//         const userId = req.user?.id;
//         const userRole = req.user?.role;
//         const staffId = req.user?.staff_id;
        
//         if (!eventId) {
//             return next();
//         }
        
//         // Owners and center managers can access all events
//         if (userRole === 'owner' || userRole === 'center') {
//             return next();
//         }
        
//         // Get event details
//         const event = await CalendarModel.getEventById(eventId);
        
//         if (!event) {
//             return res.status(404).json({ error: 'Event not found' });
//         }
        
//         // Check if user is the creator or assigned staff
//         if (event.created_by === userId || event.staff_id === staffId) {
//             return next();
//         }
        
//         // Staff can view their own events
//         if (req.method === 'GET' && event.staff_id === staffId) {
//             return next();
//         }
        
//         return res.status(403).json({ 
//             error: 'You do not have permission to access this event' 
//         });
//     } catch (error) {
//         console.error('Error validating event access:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Check if user can create events
//  */
// function canCreateEvents(req, res, next) {
//     try {
//         const userRole = req.user?.role;
        
//         if (!['owner', 'center', 'staff'].includes(userRole)) {
//             return res.status(403).json({ 
//                 error: 'You do not have permission to create events' 
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking create permission:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Check if user can delete events
//  */
// function canDeleteEvents(req, res, next) {
//     try {
//         const userRole = req.user?.role;
        
//         // Only owner and center can delete events
//         if (!['owner', 'center'].includes(userRole)) {
//             return res.status(403).json({ 
//                 error: 'Only owners and center managers can delete events' 
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking delete permission:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// // ==================== BUSINESS RULE MIDDLEWARE ====================

// /**
//  * Check business hours
//  */
// async function checkBusinessHours(req, res, next) {
//     try {
//         const { booking_date, start_time, end_time } = req.body;
//         const salonId = req.user?.salon_id || 1;
        
//         if (!booking_date || !start_time) {
//             return next();
//         }
        
//         // Get day of week (0 = Sunday, 1 = Monday, etc.)
//         const bookingDate = new Date(booking_date);
//         const dayOfWeek = bookingDate.getDay();
        
//         // Check if salon is open on this day
//         const db = require('../config/database');
//         const [businessHours] = await db.query(
//             `SELECT open_time, close_time, is_closed 
//              FROM business_hours 
//              WHERE salon_id = ? AND day_of_week = ?`,
//             [salonId, dayOfWeek]
//         );
        
//         if (businessHours.length === 0) {
//             // No business hours set, allow
//             return next();
//         }
        
//         const hours = businessHours[0];
        
//         if (hours.is_closed) {
//             return res.status(400).json({ 
//                 error: 'Salon is closed on this day' 
//             });
//         }
        
//         const bookingStartTime = start_time;
//         const bookingEndTime = end_time || start_time;
        
//         // Check if booking is within business hours
//         if (bookingStartTime < hours.open_time || bookingEndTime > hours.close_time) {
//             return res.status(400).json({ 
//                 error: `Booking must be within business hours: ${hours.open_time} - ${hours.close_time}` 
//             });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking business hours:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// /**
//  * Check service requirements
//  */
// async function checkServiceRequirements(req, res, next) {
//     try {
//         const { service_id, room_id } = req.body;
        
//         if (!service_id || !room_id) {
//             return next();
//         }
        
//         // Get service and room details
//         const db = require('../config/database');
        
//         // Check if service has room restrictions
//         const [serviceRooms] = await db.query(
//             `SELECT room_id FROM service_rooms WHERE service_id = ?`,
//             [service_id]
//         );
        
//         if (serviceRooms.length > 0) {
//             const allowedRooms = serviceRooms.map(sr => sr.room_id);
//             if (!allowedRooms.includes(parseInt(room_id))) {
//                 return res.status(400).json({ 
//                     error: 'This service cannot be performed in the selected room',
//                     allowed_rooms: allowedRooms
//                 });
//             }
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error checking service requirements:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

// // ==================== ERROR HANDLING ====================

// /**
//  * Handle calendar errors
//  */
// function calendarErrorHandler(err, req, res, next) {
//     console.error('Calendar error:', err);
    
//     if (err.code === 'ER_DUP_ENTRY') {
//         return res.status(409).json({ 
//             error: 'Duplicate entry detected',
//             details: err.message
//         });
//     }
    
//     if (err.code === 'ER_NO_REFERENCED_ROW_2') {
//         return res.status(400).json({ 
//             error: 'Invalid reference (foreign key constraint)',
//             details: err.message
//         });
//     }
    
//     res.status(500).json({ 
//         error: 'Internal server error',
//         details: err.message
//     });
// }

// module.exports = {
//     // Validation
//     validateBookingTime,
//     validateStatusTransition,
//     validateEventType,
    
//     // Availability
//     checkStaffAvailability,
//     checkRoomAvailability,
//     checkAllAvailability,
    
//     // Permissions
//     checkCalendarPermission,
//     validateEventAccess,
//     canCreateEvents,
//     canDeleteEvents,
    
//     // Business Rules
//     checkBusinessHours,
//     checkServiceRequirements,
    
//     // Error Handling
//     calendarErrorHandler
// };

/**
 * Calendar Pro v5 - Middleware (ADAPTED to Existing Database)
 * Validation, availability checking, permissions
 */

const CalendarModel = require('../models/calendar.model');

// ==================== VALIDATION MIDDLEWARE ====================

/**
 * Validate booking time and date
 */
function validateBookingTime(req, res, next) {
    try {
        const { booking_date, start_time, end_time } = req.body;
        
        if (!booking_date || !start_time) {
            return res.status(400).json({ 
                error: 'booking_date and start_time are required' 
            });
        }
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(booking_date)) {
            return res.status(400).json({ 
                error: 'Invalid booking_date format. Use YYYY-MM-DD' 
            });
        }
        
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(start_time)) {
            return res.status(400).json({ 
                error: 'Invalid start_time format. Use HH:MM' 
            });
        }
        
        if (end_time && !timeRegex.test(end_time)) {
            return res.status(400).json({ 
                error: 'Invalid end_time format. Use HH:MM' 
            });
        }
        
        // Check if date is valid
        const bookingDate = new Date(booking_date);
        if (isNaN(bookingDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid booking_date value' 
            });
        }
        
        // Check if start_time is before end_time
        if (end_time) {
            const startTimeParts = start_time.split(':');
            const endTimeParts = end_time.split(':');
            
            const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
            const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
            
            if (startMinutes >= endMinutes) {
                return res.status(400).json({ 
                    error: 'start_time must be before end_time' 
                });
            }
        }
        
        // Check minimum booking notice (1 hour)
        const now = new Date();
        const minBookingDate = new Date(now.getTime() + (60 * 60 * 1000));
        const bookingDateTime = new Date(`${booking_date} ${start_time}`);
        
        if (bookingDateTime < minBookingDate) {
            return res.status(400).json({ 
                error: 'Bookings must be made at least 1 hour in advance' 
            });
        }
        
        // Check maximum booking days ahead (90 days)
        const maxBookingDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
        if (bookingDateTime > maxBookingDate) {
            return res.status(400).json({ 
                error: 'Bookings can only be made up to 90 days in advance' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error validating booking time:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Validate event status transition
 */
function validateStatusTransition(req, res, next) {
    try {
        const { status } = req.body;
        
        if (!status) {
            return next(); // No status change
        }
        
        const validStatuses = ['pending', 'confirmed', 'in_service', 'completed', 'cancelled', 'no_show'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }
        
        // Validate status transitions
        const validTransitions = {
            'pending': ['confirmed', 'cancelled', 'no_show'],
            'confirmed': ['pending', 'in_service', 'cancelled'],
            'in_service': ['confirmed', 'completed', 'cancelled'],
            'completed': [],
            'cancelled': [],
            'no_show': []
        };
        
        // If updating existing event, check transition validity
        if (req.params.id) {
            CalendarModel.getEventById(req.params.id)
                .then(event => {
                    if (event) {
                        const allowedTransitions = validTransitions[event.status] || [];
                        if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
                            return res.status(400).json({ 
                                error: `Cannot transition from ${event.status} to ${status}. Allowed: ${allowedTransitions.join(', ')}` 
                            });
                        }
                    }
                    next();
                })
                .catch(err => {
                    next(); // Proceed if we can't get current status
                });
        } else {
            next();
        }
    } catch (error) {
        console.error('Error validating status transition:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Validate event type
 */
function validateEventType(req, res, next) {
    try {
        const { event_type } = req.body;
        
        if (!event_type) {
            return next(); // No event_type specified, default will be applied
        }
        
        const validEventTypes = ['booking', 'block', 'leave', 'break', 'training', 'meeting', 'maintenance'];
        
        if (!validEventTypes.includes(event_type)) {
            return res.status(400).json({ 
                error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error validating event type:', error);
        res.status(500).json({ error: error.message });
    }
}

// ==================== AVAILABILITY MIDDLEWARE ====================

/**
 * Check staff availability
 */
async function checkStaffAvailability(req, res, next) {
    try {
        const { staff_id, booking_date, start_time, end_time } = req.body;
        
        if (!staff_id) {
            return next(); // No staff specified, skip check
        }
        
        if (!booking_date || !start_time) {
            return res.status(400).json({ 
                error: 'booking_date and start_time are required to check staff availability' 
            });
        }
        
        const eventId = req.params.id || null;
        const endTime = end_time || start_time; // Default to 30 min if not specified
        
        const isAvailable = await CalendarModel.isStaffAvailable(
            staff_id,
            booking_date,
            start_time,
            endTime,
            eventId
        );
        
        if (!isAvailable) {
            return res.status(409).json({ 
                error: 'Staff is not available during this time slot',
                conflict_type: 'staff',
                code: 'STAFF_CONFLICT'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking staff availability:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Check room availability
 */
async function checkRoomAvailability(req, res, next) {
    try {
        const { room_id, booking_date, start_time, end_time } = req.body;
        
        if (!room_id) {
            return next(); // No room specified, skip check
        }
        
        if (!booking_date || !start_time) {
            return res.status(400).json({ 
                error: 'booking_date and start_time are required to check room availability' 
            });
        }
        
        const eventId = req.params.id || null;
        const endTime = end_time || start_time;
        
        const isAvailable = await CalendarModel.isRoomAvailable(
            room_id,
            booking_date,
            start_time,
            endTime,
            eventId
        );
        
        if (!isAvailable) {
            return res.status(409).json({ 
                error: 'Room is not available during this time slot',
                conflict_type: 'room',
                code: 'ROOM_CONFLICT'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking room availability:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Check all availability (staff and room)
 */
async function checkAllAvailability(req, res, next) {
    try {
        const { staff_id, room_id, booking_date, start_time, end_time } = req.body;
        
        if (!booking_date || !start_time) {
            return next();
        }
        
        const eventId = req.params.id || null;
        const endTime = end_time || start_time;
        
        const conflicts = [];
        
        // Check staff availability
        if (staff_id) {
            const isStaffAvailable = await CalendarModel.isStaffAvailable(
                staff_id,
                booking_date,
                start_time,
                endTime,
                eventId
            );
            
            if (!isStaffAvailable) {
                conflicts.push({
                    type: 'staff',
                    message: 'Staff is not available during this time slot'
                });
            }
        }
        
        // Check room availability
        if (room_id) {
            const isRoomAvailable = await CalendarModel.isRoomAvailable(
                room_id,
                booking_date,
                start_time,
                endTime,
                eventId
            );
            
            if (!isRoomAvailable) {
                conflicts.push({
                    type: 'room',
                    message: 'Room is not available during this time slot'
                });
            }
        }
        
        if (conflicts.length > 0) {
            return res.status(409).json({ 
                error: 'Availability conflicts detected',
                conflicts: conflicts,
                code: 'AVAILABILITY_CONFLICT'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: error.message });
    }
}

// ==================== PERMISSION MIDDLEWARE ====================

/**
 * Check calendar permissions based on user role
 */
function checkCalendarPermission(requiredRole) {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            
            // Role hierarchy: owner > center > staff
            const roleHierarchy = {
                'owner': 3,
                'center': 2,
                'staff': 1
            };
            
            const userLevel = roleHierarchy[userRole] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 0;
            
            if (userLevel < requiredLevel) {
                return res.status(403).json({ 
                    error: `Insufficient permissions. Required role: ${requiredRole}` 
                });
            }
            
            next();
        } catch (error) {
            console.error('Error checking calendar permission:', error);
            res.status(500).json({ error: error.message });
        }
    };
}

/**
 * Validate event access (owner or staff assigned)
 */
async function validateEventAccess(req, res, next) {
    try {
        const eventId = req.params.id || req.body.event_id;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const staffId = req.user?.staff_id;
        
        if (!eventId) {
            return next();
        }
        
        // Owners and center managers can access all events
        if (userRole === 'owner' || userRole === 'center') {
            return next();
        }
        
        // Get event details
        const event = await CalendarModel.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Check if user is the creator or assigned staff
        if (event.created_by === userId || event.staff_id === staffId) {
            return next();
        }
        
        // Staff can view their own events
        if (req.method === 'GET' && event.staff_id === staffId) {
            return next();
        }
        
        return res.status(403).json({ 
            error: 'You do not have permission to access this event' 
        });
    } catch (error) {
        console.error('Error validating event access:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Check if user can create events
 */
function canCreateEvents(req, res, next) {
    try {
        const userRole = req.user?.role;
        
        if (!['owner', 'center', 'staff'].includes(userRole)) {
            return res.status(403).json({ 
                error: 'You do not have permission to create events' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking create permission:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Check if user can delete events
 */
function canDeleteEvents(req, res, next) {
    try {
        const userRole = req.user?.role;
        
        // Only owner and center can delete events
        if (!['owner', 'center'].includes(userRole)) {
            return res.status(403).json({ 
                error: 'Only owners and center managers can delete events' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking delete permission:', error);
        res.status(500).json({ error: error.message });
    }
}

// ==================== BUSINESS RULE MIDDLEWARE ====================

/**
 * Check business hours
 */
async function checkBusinessHours(req, res, next) {
    try {
        const { booking_date, start_time, end_time } = req.body;
        const salonId = req.user?.salon_id || 1;
        
        if (!booking_date || !start_time) {
            return next();
        }
        
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const bookingDate = new Date(booking_date);
        const dayOfWeek = bookingDate.getDay();
        
        // Check if salon is open on this day
        const db = require('../config/database');
        const [businessHours] = await db.query(
            `SELECT open_time, close_time, is_closed 
             FROM business_hours 
             WHERE salon_id = ? AND day_of_week = ?`,
            [salonId, dayOfWeek]
        );
        
        if (businessHours.length === 0) {
            // No business hours set, allow
            return next();
        }
        
        const hours = businessHours[0];
        
        if (hours.is_closed) {
            return res.status(400).json({ 
                error: 'Salon is closed on this day' 
            });
        }
        
        const bookingStartTime = start_time;
        const bookingEndTime = end_time || start_time;
        
        // Check if booking is within business hours
        if (bookingStartTime < hours.open_time || bookingEndTime > hours.close_time) {
            return res.status(400).json({ 
                error: `Booking must be within business hours: ${hours.open_time} - ${hours.close_time}` 
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking business hours:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Check service requirements
 */
async function checkServiceRequirements(req, res, next) {
    try {
        const { service_id, room_id } = req.body;
        
        if (!service_id || !room_id) {
            return next();
        }
        
        // Get service and room details
        const db = require('../config/database');
        
        // Check if service has room restrictions
        const [serviceRooms] = await db.query(
            `SELECT room_id FROM service_rooms WHERE service_id = ?`,
            [service_id]
        );
        
        if (serviceRooms.length > 0) {
            const allowedRooms = serviceRooms.map(sr => sr.room_id);
            if (!allowedRooms.includes(parseInt(room_id))) {
                return res.status(400).json({ 
                    error: 'This service cannot be performed in the selected room',
                    allowed_rooms: allowedRooms
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Error checking service requirements:', error);
        res.status(500).json({ error: error.message });
    }
}

// ==================== ERROR HANDLING ====================

/**
 * Handle calendar errors
 */
function calendarErrorHandler(err, req, res, next) {
    console.error('Calendar error:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
            error: 'Duplicate entry detected',
            details: err.message
        });
    }
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ 
            error: 'Invalid reference (foreign key constraint)',
            details: err.message
        });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message
    });
}

module.exports = {
    // Validation
    validateBookingTime,
    validateStatusTransition,
    validateEventType,
    
    // Availability
    checkStaffAvailability,
    checkRoomAvailability,
    checkAllAvailability,
    
    // Permissions
    checkCalendarPermission,
    validateEventAccess,
    canCreateEvents,
    canDeleteEvents,
    
    // Business Rules
    checkBusinessHours,
    checkServiceRequirements,
    
    // Error Handling
    calendarErrorHandler
};