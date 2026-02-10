/**
 * Calendar Controller
 * 
 * Production-grade calendar management system with comprehensive update handling
 * Features: event management, availability checking, resource management
 * 
 * @module controllers/calendarController
 */

const { pool } = require('../config/database');

// Constants for maintainability
const STATUS_COLORS = {
    CONFIRMED: '#1cc88a',
    PENDING: '#f6c23e',
    IN_PROGRESS: '#36b9cc',
    IN_SERVICE: '#36b9cc',
    COMPLETED: '#6f42c1',
    CANCELLED: '#e74a3b',
    DEFAULT: '#4e73df'
};

const EVENT_STATUS = {
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    CONFIRMED: 'confirmed',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    IN_SERVICE: 'in_service'
};

const UPDATE_TYPES = {
    DRAG_DROP: 'drag_drop',
    FULL_UPDATE: 'full_update',
    STATUS_CHANGE: 'status_change',
    TIME_ADJUSTMENT: 'time_adjustment'
};

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_DATE_RANGE_DAYS = 30;

// Error messages
const ERROR_MESSAGES = {
    INVALID_INPUT: 'Invalid input parameters',
    EVENT_NOT_FOUND: 'Appointment not found',
    DATABASE_ERROR: 'Database operation failed',
    VALIDATION_FAILED: 'Validation failed',
    CONFLICT_DETECTED: 'Schedule conflict detected'
};

/**
 * Calendar Service - Encapsulates business logic
 */
class CalendarService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Converts any date value to ISO date string (YYYY-MM-DD)
     * @param {Date|string} dateValue - Input date
     * @returns {string} ISO date string
     */
    static toISODate(dateValue) {
        if (!dateValue) {
            return new Date().toISOString().split('T')[0];
        }
        
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0];
        }
        
        return date.toISOString().split('T')[0];
    }

    /**
     * Calculates end time based on start time and duration
     * @param {string} startTime - Start time in HH:mm:ss format
     * @param {number} durationMinutes - Duration in minutes
     * @param {string} date - Date for reference
     * @returns {string} End time in HH:mm:ss format
     */
    static calculateEndTime(startTime, durationMinutes, date = '2000-01-01') {
        const startDateTime = new Date(`${date}T${startTime}`);
        startDateTime.setMinutes(startDateTime.getMinutes() + durationMinutes);
        return startDateTime.toTimeString().slice(0, 8);
    }

    /**
     * Determines event color based on status
     * @param {string} status - Event status
     * @returns {Object} Color configuration
     */
    static getEventColor(status) {
        const colorMap = {
            [EVENT_STATUS.CONFIRMED]: STATUS_COLORS.CONFIRMED,
            [EVENT_STATUS.PENDING]: STATUS_COLORS.PENDING,
            [EVENT_STATUS.IN_PROGRESS]: STATUS_COLORS.IN_PROGRESS,
            [EVENT_STATUS.IN_SERVICE]: STATUS_COLORS.IN_SERVICE,
            [EVENT_STATUS.COMPLETED]: STATUS_COLORS.COMPLETED,
            [EVENT_STATUS.CANCELLED]: STATUS_COLORS.CANCELLED
        };

        const color = colorMap[status] || STATUS_COLORS.DEFAULT;
        return {
            color,
            backgroundColor: color,
            borderColor: color,
            textColor: '#ffffff'
        };
    }

    /**
     * Builds SQL query with dynamic filters
     * @param {number} salonId - Salon identifier
     * @param {Object} filters - Query filters
     * @returns {Object} Query and parameters
     */
    buildEventsQuery(salonId, filters) {
        const {
            start,
            end,
            staff_id: staffId,
            room_id: roomId,
            status,
            search
        } = filters;

        let query = `
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.status,
                b.total_amount,
                b.notes,
                b.customer_id,
                c.id as customer_id,
                c.name as customer_name,
                c.phone as customer_phone,
                s.id as service_id,
                s.name as service_name,
                s.duration_minutes as service_duration,
                st.id as staff_id,
                st.name as staff_name,
                r.id as room_id,
                r.name as room_name,
                bi.duration_minutes as booking_item_duration,
                bi.id as booking_item_id
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            LEFT JOIN booking_items bi ON b.id = bi.booking_id
            LEFT JOIN services s ON bi.service_id = s.id
            LEFT JOIN staff st ON bi.staff_id = st.id
            LEFT JOIN rooms r ON bi.room_id = r.id
            WHERE b.salon_id = ? AND b.status NOT IN (?)
        `;

        const params = [salonId, EVENT_STATUS.CANCELLED];

        // Date range filter
        const startDate = start || CalendarService.toISODate(new Date());
        const endDate = end || CalendarService.toISODate(
            new Date(Date.now() + DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000)
        );
        
        query += ' AND b.booking_date BETWEEN ? AND ?';
        params.push(startDate, endDate);

        // Additional filters
        if (staffId) {
            query += ' AND bi.staff_id = ?';
            params.push(staffId);
        }

        if (roomId) {
            query += ' AND bi.room_id = ?';
            params.push(roomId);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (c.name LIKE ? OR s.name LIKE ? OR st.name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY b.booking_date ASC, b.start_time ASC';

        return { query, params };
    }

    /**
     * Formats booking data for calendar display
     * @param {Object} booking - Raw booking data
     * @returns {Object} Formatted calendar event
     */
    formatCalendarEvent(booking) {
        const colors = CalendarService.getEventColor(booking.status);
        const datePart = CalendarService.toISODate(booking.booking_date);
        
        // Generate event title
        const titleParts = [
            booking.customer_name || 'Customer',
            booking.service_name || 'Service'
        ];
        if (booking.staff_name) {
            titleParts.push(booking.staff_name);
        }
        const title = titleParts.join(' - ');

        // Calculate start datetime
        const startDateTime = `${datePart}T${booking.start_time}`;

        // Calculate end datetime
        let endDateTime;
        if (booking.end_time && booking.end_time !== booking.start_time) {
            endDateTime = `${datePart}T${booking.end_time}`;
        } else {
            const duration = booking.booking_item_duration || 
                           booking.service_duration || 
                           DEFAULT_DURATION_MINUTES;
            const endDate = new Date(startDateTime);
            endDate.setMinutes(endDate.getMinutes() + duration);
            endDateTime = endDate.toISOString().replace('Z', '').split('.')[0];
        }

        // Validate dates
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format in booking data');
        }

        return {
            id: booking.id,
            title,
            start: startDateTime,
            end: endDateTime,
            ...colors,
            display: 'auto',
            allDay: false,
            editable: true,
            durationEditable: true,
            extendedProps: {
                booking_id: booking.id,
                customer_id: booking.customer_id,
                customer_name: booking.customer_name,
                customer_phone: booking.customer_phone,
                service_id: booking.service_id,
                service_name: booking.service_name,
                staff_id: booking.staff_id,
                staff_name: booking.staff_name,
                room_id: booking.room_id,
                room_name: booking.room_name,
                status: booking.status,
                total_amount: booking.total_amount,
                notes: booking.notes,
                duration: booking.booking_item_duration || booking.service_duration,
                booking_item_id: booking.booking_item_id
            }
        };
    }

    /**
     * Determines update type based on request data
     * @param {Object} updateData - Update request data
     * @returns {string} Update type
     */
    static determineUpdateType(updateData) {
        const hasDateTime = updateData.booking_date && updateData.start_time;
        const hasServiceDetails = updateData.service_id || updateData.staff_id || updateData.room_id;
        const hasCustomer = updateData.customer_id;
        const hasStatus = updateData.status;
        
        if (hasDateTime && !hasServiceDetails && !hasCustomer && !hasStatus) {
            return UPDATE_TYPES.DRAG_DROP;
        } else if (hasStatus && !hasDateTime && !hasServiceDetails && !hasCustomer) {
            return UPDATE_TYPES.STATUS_CHANGE;
        } else if (hasDateTime && (hasServiceDetails || hasCustomer || hasStatus)) {
            return UPDATE_TYPES.FULL_UPDATE;
        } else if (updateData.start_time || updateData.end_time) {
            return UPDATE_TYPES.TIME_ADJUSTMENT;
        }
        
        return UPDATE_TYPES.FULL_UPDATE;
    }

    /**
     * Validates if update is a simple drag-drop operation
     * @param {Object} updateData - Update request data
     * @returns {boolean} True if drag-drop update
     */
    static isDragDropUpdate(updateData) {
        const updateType = this.determineUpdateType(updateData);
        return updateType === UPDATE_TYPES.DRAG_DROP;
    }

    /**
     * Extracts booking item ID from extended properties or update data
     * @param {Object} booking - Booking data
     * @param {Object} updateData - Update data
     * @returns {number|null} Booking item ID
     */
    static getBookingItemId(booking, updateData) {
        return booking.booking_item_id || 
               updateData.booking_item_id || 
               updateData.extendedProps?.booking_item_id || 
               null;
    }
}

/**
 * Validation utilities
 */
class ValidationUtils {
    /**
     * Validates event creation data
     * @param {Object} data - Event data
     * @returns {Array} [isValid, errorMessage]
     */
    static validateEventCreation(data) {
        if (!data.customer_id || !data.booking_date || !data.start_time) {
            return [false, 'Customer, date, and start time are required'];
        }

        if (!this.isValidDate(data.booking_date)) {
            return [false, 'Invalid booking date format'];
        }

        if (!this.isValidTime(data.start_time)) {
            return [false, 'Invalid start time format'];
        }

        return [true, null];
    }

    /**
     * Validates event update data
     * @param {Object} data - Update data
     * @param {string} updateType - Type of update
     * @returns {Array} [isValid, errorMessage]
     */
    static validateEventUpdate(data, updateType) {
        if (updateType === UPDATE_TYPES.DRAG_DROP || updateType === UPDATE_TYPES.TIME_ADJUSTMENT) {
            if (!data.booking_date || !data.start_time) {
                return [false, 'Date and start time are required for time updates'];
            }
            
            if (!this.isValidDate(data.booking_date)) {
                return [false, 'Invalid booking date format'];
            }

            if (!this.isValidTime(data.start_time)) {
                return [false, 'Invalid start time format'];
            }
        }

        if (data.status && !Object.values(EVENT_STATUS).includes(data.status)) {
            return [false, 'Invalid status value'];
        }

        return [true, null];
    }

    /**
     * Validates date string
     * @param {string} dateString - Date string
     * @returns {boolean} True if valid
     */
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    /**
     * Validates time string
     * @param {string} timeString - Time string
     * @returns {boolean} True if valid
     */
    static isValidTime(timeString) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeString);
    }

    /**
     * Validates if time range is logical
     * @param {string} startTime - Start time
     * @param {string} endTime - End time
     * @returns {boolean} True if end time is after start time
     */
    static isValidTimeRange(startTime, endTime) {
        if (!startTime || !endTime) return true;
        
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        return end > start;
    }
}

/**
 * Database transaction wrapper
 */
class TransactionManager {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Executes operations within a transaction
     * @param {Function} operations - Async function containing database operations
     * @returns {Promise} Transaction result
     */
    async executeTransaction(operations) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await operations(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

/**
 * Update Handler - Specialized logic for different update types
 */
class UpdateHandler {
    constructor(db) {
        this.db = db;
    }

    /**
     * Handles drag-drop (calendar move) updates
     * @param {number} bookingId - Booking ID
     * @param {Object} updateData - Update data
     * @param {number} userId - User ID
     * @param {Object} connection - Database connection
     * @returns {Promise<Object>} Update result
     */
    async handleDragDrop(bookingId, updateData, userId, connection) {
        // Calculate end time if not provided
        let endTime = updateData.end_time;
        if (!endTime) {
            // Get current booking to determine duration
            const [currentBooking] = await connection.query(`
                SELECT start_time, end_time 
                FROM bookings 
                WHERE id = ?
            `, [bookingId]);
            
            if (currentBooking[0]) {
                const start = CalendarService.parseTimeString(currentBooking[0].start_time);
                const end = CalendarService.parseTimeString(currentBooking[0].end_time);
                const durationMs = end - start;
                const durationMinutes = Math.floor(durationMs / (1000 * 60));
                
                endTime = CalendarService.calculateEndTime(
                    updateData.start_time,
                    durationMinutes,
                    updateData.booking_date
                );
            } else {
                endTime = updateData.start_time;
            }
        }

        const [result] = await connection.query(`
            UPDATE bookings SET 
                booking_date = ?,
                start_time = ?,
                end_time = ?,
                updated_at = NOW(),
                updated_by = ?
            WHERE id = ?
        `, [
            updateData.booking_date,
            updateData.start_time,
            endTime,
            userId,
            bookingId
        ]);

        return {
            affectedRows: result.affectedRows,
            updateType: UPDATE_TYPES.DRAG_DROP
        };
    }

    /**
     * Handles full booking updates
     * @param {number} bookingId - Booking ID
     * @param {Object} updateData - Update data
     * @param {number} userId - User ID
     * @param {Object} connection - Database connection
     * @returns {Promise<Object>} Update result
     */
    async handleFullUpdate(bookingId, updateData, userId, connection) {
        // First, update the main booking record
        const updateFields = [];
        const updateValues = [];

        const allowedBookingFields = [
            'customer_id', 'booking_date', 'start_time', 'end_time',
            'status', 'notes', 'total_amount'
        ];

        allowedBookingFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(updateData[field]);
            }
        });

        updateFields.push('updated_at = NOW()', 'updated_by = ?');
        updateValues.push(userId, bookingId);

        const bookingQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
        const [bookingResult] = await connection.query(bookingQuery, updateValues);

        // Handle booking items update
        let bookingItemResult = null;
        if (updateData.service_id || updateData.staff_id || updateData.room_id || updateData.duration_minutes) {
            bookingItemResult = await this.handleBookingItemUpdate(bookingId, updateData, connection);
        }

        return {
            affectedRows: bookingResult.affectedRows,
            bookingItemUpdated: bookingItemResult?.affectedRows > 0,
            updateType: UPDATE_TYPES.FULL_UPDATE
        };
    }

    /**
     * Updates booking item details
     * @param {number} bookingId - Booking ID
     * @param {Object} updateData - Update data
     * @param {Object} connection - Database connection
     * @returns {Promise<Object>} Update result
     */
    async handleBookingItemUpdate(bookingId, updateData, connection) {
        // First, check if booking item exists
        const [existingItems] = await connection.query(
            'SELECT id FROM booking_items WHERE booking_id = ?',
            [bookingId]
        );

        if (existingItems.length === 0) {
            // Create new booking item if it doesn't exist
            const [result] = await connection.query(`
                INSERT INTO booking_items SET
                    booking_id = ?,
                    service_id = ?,
                    staff_id = ?,
                    room_id = ?,
                    duration_minutes = ?,
                    price = ?,
                    category_id = 1,
                    subcategory_id = 1
            `, [
                bookingId,
                updateData.service_id || null,
                updateData.staff_id || null,
                updateData.room_id || null,
                updateData.duration_minutes || DEFAULT_DURATION_MINUTES,
                updateData.price || 0
            ]);
            
            return { affectedRows: result.affectedRows };
        } else {
            // Update existing booking item
            const bookingItemId = existingItems[0].id;
            const updateFields = [];
            const updateValues = [];

            const allowedItemFields = ['service_id', 'staff_id', 'room_id', 'duration_minutes', 'price'];
            
            allowedItemFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updateData[field]);
                }
            });

            if (updateFields.length === 0) {
                return { affectedRows: 0 };
            }

            updateValues.push(bookingItemId);
            const query = `UPDATE booking_items SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.query(query, updateValues);
            
            return { affectedRows: result.affectedRows };
        }
    }

    /**
     * Handles status change updates
     * @param {number} bookingId - Booking ID
     * @param {Object} updateData - Update data
     * @param {number} userId - User ID
     * @param {Object} connection - Database connection
     * @returns {Promise<Object>} Update result
     */
    async handleStatusChange(bookingId, updateData, userId, connection) {
        const [result] = await connection.query(`
            UPDATE bookings SET 
                status = ?,
                updated_at = NOW(),
                updated_by = ?
            WHERE id = ?
        `, [
            updateData.status,
            userId,
            bookingId
        ]);

        return {
            affectedRows: result.affectedRows,
            updateType: UPDATE_TYPES.STATUS_CHANGE
        };
    }

    /**
     * Handles time adjustment updates
     * @param {number} bookingId - Booking ID
     * @param {Object} updateData - Update data
     * @param {number} userId - User ID
     * @param {Object} connection - Database connection
     * @returns {Promise<Object>} Update result
     */
    async handleTimeAdjustment(bookingId, updateData, userId, connection) {
        const updateFields = [];
        const updateValues = [];

        if (updateData.start_time) {
            updateFields.push('start_time = ?');
            updateValues.push(updateData.start_time);
        }

        if (updateData.end_time) {
            updateFields.push('end_time = ?');
            updateValues.push(updateData.end_time);
        }

        if (updateData.booking_date) {
            updateFields.push('booking_date = ?');
            updateValues.push(updateData.booking_date);
        }

        updateFields.push('updated_at = NOW()', 'updated_by = ?');
        updateValues.push(userId, bookingId);

        const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
        const [result] = await connection.query(query, updateValues);

        return {
            affectedRows: result.affectedRows,
            updateType: UPDATE_TYPES.TIME_ADJUSTMENT
        };
    }
}

/**
 * Controller methods
 */
class CalendarController {
    constructor() {
        this.service = new CalendarService(pool);
        this.transactionManager = new TransactionManager(pool);
        this.updateHandler = new UpdateHandler(pool);
    }

    /**
     * Get all calendar events with filtering
     * @route GET /api/calendar/events
     */
    async getEvents(req, res) {
        try {
            const salonId = req.user?.salon_id || 1;
            const filters = req.query;

            const { query, params } = this.service.buildEventsQuery(salonId, filters);
            
            const [bookings] = await this.service.db.query(query, params);
            
            const formattedEvents = bookings.map(booking => 
                this.service.formatCalendarEvent(booking)
            );

            res.json({
                success: true,
                data: formattedEvents,
                total: formattedEvents.length,
                meta: {
                    count: formattedEvents.length,
                    filteredBy: Object.keys(filters).filter(key => filters[key])
                }
            });
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Create new calendar event
     * @route POST /api/calendar/events
     */
    async createEvent(req, res) {
        try {
            const [isValid, errorMessage] = ValidationUtils.validateEventCreation(req.body);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: ERROR_MESSAGES.VALIDATION_FAILED,
                    message: errorMessage
                });
            }

            const salonId = req.user?.salon_id || 1;
            const userId = req.user?.id || 1;
            const eventData = req.body;

            // Check for conflicts before creating
            const conflictCheck = await this.checkForConflicts(eventData, null, salonId);
            if (!conflictCheck.available) {
                return res.status(409).json({
                    success: false,
                    error: ERROR_MESSAGES.CONFLICT_DETECTED,
                    conflicts: conflictCheck.conflicts,
                    message: 'Schedule conflict detected'
                });
            }

            const result = await this.transactionManager.executeTransaction(async (connection) => {
                // Calculate end time
                let endTime = eventData.end_time;
                if (!endTime) {
                    let duration = DEFAULT_DURATION_MINUTES;
                    if (eventData.service_id) {
                        const [service] = await connection.query(
                            'SELECT duration_minutes FROM services WHERE id = ?',
                            [eventData.service_id]
                        );
                        
                        if (service[0]?.duration_minutes) {
                            duration = service[0].duration_minutes;
                        }
                    }
                    
                    endTime = CalendarService.calculateEndTime(
                        eventData.start_time,
                        duration,
                        eventData.booking_date
                    );
                }

                // Validate time range
                if (!ValidationUtils.isValidTimeRange(eventData.start_time, endTime)) {
                    throw new Error('End time must be after start time');
                }

                // Create booking
                const [bookingResult] = await connection.query(`
                    INSERT INTO bookings SET 
                        salon_id = ?,
                        customer_id = ?,
                        booking_type = 'appointment',
                        booking_date = ?,
                        start_time = ?,
                        end_time = ?,
                        status = ?,
                        notes = ?,
                        created_by = ?,
                        updated_by = ?,
                        created_at = NOW(),
                        updated_at = NOW()
                `, [
                    salonId,
                    eventData.customer_id,
                    eventData.booking_date,
                    eventData.start_time,
                    endTime,
                    eventData.status || EVENT_STATUS.PENDING,
                    eventData.notes || '',
                    userId,
                    userId
                ]);

                const bookingId = bookingResult.insertId;

                // Create booking item if service provided
                if (eventData.service_id || eventData.staff_id || eventData.room_id) {
                    const servicePrice = eventData.price || 0;
                    const serviceDuration = eventData.duration_minutes || DEFAULT_DURATION_MINUTES;

                    await connection.query(`
                        INSERT INTO booking_items SET
                            booking_id = ?,
                            category_id = 1,
                            subcategory_id = 1,
                            service_id = ?,
                            staff_id = ?,
                            room_id = ?,
                            duration_minutes = ?,
                            price = ?,
                            created_at = NOW(),
                            updated_at = NOW()
                    `, [
                        bookingId,
                        eventData.service_id || null,
                        eventData.staff_id || null,
                        eventData.room_id || null,
                        serviceDuration,
                        servicePrice
                    ]);
                }

                // Fetch created booking with details
                const [newBooking] = await connection.query(`
                    SELECT b.*, 
                           c.name as customer_name,
                           c.phone as customer_phone,
                           s.name as service_name,
                           st.name as staff_name,
                           r.name as room_name,
                           bi.id as booking_item_id,
                           bi.duration_minutes as service_duration
                    FROM bookings b
                    LEFT JOIN customers c ON b.customer_id = c.id
                    LEFT JOIN booking_items bi ON b.id = bi.booking_id
                    LEFT JOIN services s ON bi.service_id = s.id
                    LEFT JOIN staff st ON bi.staff_id = st.id
                    LEFT JOIN rooms r ON bi.room_id = r.id
                    WHERE b.id = ?
                `, [bookingId]);

                return newBooking[0] || { id: bookingId };
            });

            // Format response for calendar
            const formattedEvent = this.service.formatCalendarEvent(result);

            res.status(201).json({
                success: true,
                data: formattedEvent,
                message: 'Appointment created successfully',
                meta: {
                    booking_id: result.id,
                    created_at: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error creating calendar event:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Update calendar event (supports all update types)
     * @route PUT /api/calendar/events/:id
     */
    async updateEvent(req, res) {
        try {
            const eventId = req.params.id;
            const userId = req.user?.id || 1;
            const updateData = req.body;

            // Determine update type
            const updateType = CalendarService.determineUpdateType(updateData);
            
            // Validate update data
            const [isValid, errorMessage] = ValidationUtils.validateEventUpdate(updateData, updateType);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: ERROR_MESSAGES.VALIDATION_FAILED,
                    message: errorMessage
                });
            }

            // Check for conflicts (for drag-drop and time adjustments)
            if (updateType === UPDATE_TYPES.DRAG_DROP || updateType === UPDATE_TYPES.TIME_ADJUSTMENT) {
                const salonId = req.user?.salon_id || 1;
                
                // Get current booking to check staff/room assignments
                const [currentBooking] = await this.service.db.query(`
                    SELECT bi.staff_id, bi.room_id 
                    FROM bookings b
                    LEFT JOIN booking_items bi ON b.id = bi.booking_id
                    WHERE b.id = ?
                `, [eventId]);
                
                if (currentBooking[0]) {
                    const conflictCheck = await this.checkForConflicts(
                        {
                            ...updateData,
                            staff_id: currentBooking[0].staff_id,
                            room_id: currentBooking[0].room_id
                        },
                        eventId,
                        salonId
                    );
                    
                    if (!conflictCheck.available) {
                        return res.status(409).json({
                            success: false,
                            error: ERROR_MESSAGES.CONFLICT_DETECTED,
                            conflicts: conflictCheck.conflicts,
                            message: 'Schedule conflict detected'
                        });
                    }
                }
            }

            let updateResult;

            try {
                updateResult = await this.transactionManager.executeTransaction(async (connection) => {
                    switch (updateType) {
                        case UPDATE_TYPES.DRAG_DROP:
                            return await this.updateHandler.handleDragDrop(
                                eventId, updateData, userId, connection
                            );
                            
                        case UPDATE_TYPES.STATUS_CHANGE:
                            return await this.updateHandler.handleStatusChange(
                                eventId, updateData, userId, connection
                            );
                            
                        case UPDATE_TYPES.TIME_ADJUSTMENT:
                            return await this.updateHandler.handleTimeAdjustment(
                                eventId, updateData, userId, connection
                            );
                            
                        case UPDATE_TYPES.FULL_UPDATE:
                        default:
                            return await this.updateHandler.handleFullUpdate(
                                eventId, updateData, userId, connection
                            );
                    }
                });
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({
                        success: false,
                        error: 'Duplicate entry detected',
                        message: 'This appointment conflicts with an existing one'
                    });
                }
                throw error;
            }

            if (updateResult.affectedRows > 0) {
                // Fetch updated booking for response
                const [updatedBooking] = await this.service.db.query(`
                    SELECT b.*, 
                           c.name as customer_name,
                           c.phone as customer_phone,
                           s.name as service_name,
                           st.name as staff_name,
                           r.name as room_name,
                           bi.id as booking_item_id,
                           bi.duration_minutes as service_duration
                    FROM bookings b
                    LEFT JOIN customers c ON b.customer_id = c.id
                    LEFT JOIN booking_items bi ON b.id = bi.booking_id
                    LEFT JOIN services s ON bi.service_id = s.id
                    LEFT JOIN staff st ON bi.staff_id = st.id
                    LEFT JOIN rooms r ON bi.room_id = r.id
                    WHERE b.id = ?
                `, [eventId]);

                const responseData = updatedBooking[0] ? 
                    this.service.formatCalendarEvent(updatedBooking[0]) : 
                    { id: eventId };

                res.json({
                    success: true,
                    data: responseData,
                    message: `Appointment ${getUpdateMessage(updateType)}`,
                    meta: {
                        update_type: updateType,
                        updated_at: new Date().toISOString(),
                        updated_by: userId
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: ERROR_MESSAGES.EVENT_NOT_FOUND,
                    message: 'Appointment not found or no changes made'
                });
            }
        } catch (error) {
            console.error('Error updating calendar event:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Check for scheduling conflicts
     * @private
     */
    async checkForConflicts(eventData, excludeEventId, salonId) {
        const conflicts = [];
        const { staff_id, room_id, booking_date, start_time, end_time } = eventData;
        const endTime = end_time || start_time;

        if (!booking_date || !start_time) {
            return { available: true, conflicts: [] };
        }

        // Check staff conflicts
        if (staff_id) {
            const staffConflicts = await this.service.checkResourceConflicts(
                'staff_id', staff_id, booking_date, start_time, endTime, excludeEventId, salonId
            );
            if (staffConflicts.length > 0) {
                conflicts.push({
                    type: 'staff',
                    message: 'Staff member is already booked',
                    conflicts: staffConflicts
                });
            }
        }

        // Check room conflicts
        if (room_id) {
            const roomConflicts = await this.service.checkResourceConflicts(
                'room_id', room_id, booking_date, start_time, endTime, excludeEventId, salonId
            );
            if (roomConflicts.length > 0) {
                conflicts.push({
                    type: 'room',
                    message: 'Room is already booked',
                    conflicts: roomConflicts
                });
            }
        }

        return {
            available: conflicts.length === 0,
            conflicts
        };
    }

    /**
     * Check conflicts for a specific resource
     * @private
     */
    async checkResourceConflicts(resourceField, resourceId, date, startTime, endTime, excludeId, salonId) {
        let query = `
            SELECT b.id, b.start_time, b.end_time, c.name as customer_name
            FROM bookings b
            LEFT JOIN booking_items bi ON b.id = bi.booking_id
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.salon_id = ?
            AND bi.${resourceField} = ? 
            AND b.booking_date = ?
            AND b.status NOT IN (?, ?)
            AND (
                (b.start_time < ? AND b.end_time > ?) OR
                (b.start_time >= ? AND b.start_time < ?) OR
                (b.end_time > ? AND b.end_time <= ?)
            )
        `;

        const params = [
            salonId,
            resourceId, 
            date, 
            EVENT_STATUS.CANCELLED, 
            EVENT_STATUS.COMPLETED,
            endTime, startTime, 
            startTime, endTime,
            startTime, endTime
        ];

        if (excludeId) {
            query += ` AND b.id != ?`;
            params.push(excludeId);
        }

        const [conflicts] = await this.service.db.query(query, params);
        return conflicts;
    }

    /**
     * Soft delete calendar event (cancel)
     * @route DELETE /api/calendar/events/:id
     */
    async deleteEvent(req, res) {
        try {
            const eventId = req.params.id;

            const [result] = await this.service.db.query(`
                UPDATE bookings SET 
                    status = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [EVENT_STATUS.CANCELLED, eventId]);

            if (result.affectedRows > 0) {
                res.json({
                    success: true,
                    message: 'Appointment cancelled successfully',
                    meta: {
                        cancelled_at: new Date().toISOString()
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: ERROR_MESSAGES.EVENT_NOT_FOUND
                });
            }
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Check availability for time slot
     * @route GET /api/calendar/availability
     */
    async checkAvailability(req, res) {
        try {
            const { staff_id, room_id, booking_date, start_time, end_time, exclude_event_id } = req.query;

            if (!booking_date || !start_time) {
                return res.status(400).json({
                    success: false,
                    error: ERROR_MESSAGES.VALIDATION_FAILED,
                    message: 'Booking date and start time are required'
                });
            }

            const salonId = req.user?.salon_id || 1;
            const conflicts = [];
            const endTime = end_time || start_time;

            // Check staff conflicts
            if (staff_id) {
                const staffConflicts = await this.checkResourceConflicts(
                    'staff_id', staff_id, booking_date, start_time, endTime, exclude_event_id, salonId
                );
                if (staffConflicts.length > 0) {
                    conflicts.push({
                        type: 'staff',
                        message: 'Staff already booked',
                        conflicts: staffConflicts
                    });
                }
            }

            // Check room conflicts
            if (room_id) {
                const roomConflicts = await this.checkResourceConflicts(
                    'room_id', room_id, booking_date, start_time, endTime, exclude_event_id, salonId
                );
                if (roomConflicts.length > 0) {
                    conflicts.push({
                        type: 'room',
                        message: 'Room already booked',
                        conflicts: roomConflicts
                    });
                }
            }

            res.json({
                success: true,
                available: conflicts.length === 0,
                conflicts,
                meta: {
                    checkedResources: {
                        staff: !!staff_id,
                        room: !!room_id
                    }
                }
            });
        } catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Get all calendar resources
     * @route GET /api/calendar/resources
     */
    async getResources(req, res) {
        try {
            const salonId = req.user?.salon_id || 1;

            const [staff, customers, services, rooms] = await Promise.all([
                this.service.db.query(
                    'SELECT id, name, email, phone FROM staff WHERE salon_id = ? AND status = "active"',
                    [salonId]
                ),
                this.service.db.query(
                    'SELECT id, name, phone, email FROM customers WHERE salon_id = ? ORDER BY name ASC LIMIT 200',
                    [salonId]
                ),
                this.service.db.query(
                    'SELECT id, name, duration_minutes, base_price as price FROM services WHERE salon_id = ? AND is_active = true',
                    [salonId]
                ),
                this.service.db.query(
                    'SELECT id, name, room_type, capacity FROM rooms WHERE salon_id = ? AND is_active = true',
                    [salonId]
                )
            ]);

            res.json({
                success: true,
                data: {
                    staff: staff[0],
                    customers: customers[0],
                    services: services[0],
                    rooms: rooms[0]
                },
                meta: {
                    counts: {
                        staff: staff[0].length,
                        customers: customers[0].length,
                        services: services[0].length,
                        rooms: rooms[0].length
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching calendar resources:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }

    /**
     * Get today's statistics
     * @route GET /api/calendar/stats/today
     */
    async getTodayStats(req, res) {
        try {
            const salonId = req.user?.salon_id || 1;
            const today = new Date().toISOString().split('T')[0];

            const [stats] = await this.service.db.query(`
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_events,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed_events,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as in_progress_events,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_events,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_events,
                    SUM(CASE WHEN status NOT IN (?, ?) THEN 1 ELSE 0 END) as active_events
                FROM bookings
                WHERE salon_id = ? AND booking_date = ?
            `, [
                EVENT_STATUS.PENDING,
                EVENT_STATUS.CONFIRMED,
                EVENT_STATUS.IN_PROGRESS,
                EVENT_STATUS.COMPLETED,
                EVENT_STATUS.CANCELLED,
                EVENT_STATUS.CANCELLED,
                EVENT_STATUS.COMPLETED,
                salonId, 
                today
            ]);

            const [revenue] = await this.service.db.query(`
                SELECT COALESCE(SUM(total_amount), 0) as today_revenue
                FROM bookings
                WHERE salon_id = ? AND booking_date = ? AND status = ?
            `, [salonId, today, EVENT_STATUS.COMPLETED]);

            const result = stats[0] || {
                total_events: 0,
                pending_events: 0,
                confirmed_events: 0,
                in_progress_events: 0,
                completed_events: 0,
                cancelled_events: 0,
                active_events: 0
            };

            result.today_revenue = revenue[0]?.today_revenue || 0;

            res.json({
                success: true,
                data: result,
                meta: {
                    date: today,
                    salon_id: salonId
                }
            });
        } catch (error) {
            console.error('Error fetching today\'s statistics:', error);
            res.status(500).json({
                success: false,
                error: ERROR_MESSAGES.DATABASE_ERROR,
                message: error.message
            });
        }
    }
}

/**
 * Helper function to get update message based on update type
 * @param {string} updateType - Type of update
 * @returns {string} Human-readable message
 */
function getUpdateMessage(updateType) {
    const messages = {
        [UPDATE_TYPES.DRAG_DROP]: 'moved successfully',
        [UPDATE_TYPES.STATUS_CHANGE]: 'status updated successfully',
        [UPDATE_TYPES.TIME_ADJUSTMENT]: 'time adjusted successfully',
        [UPDATE_TYPES.FULL_UPDATE]: 'updated successfully'
    };
    
    return messages[updateType] || 'updated successfully';
}

// Create controller instance
const calendarController = new CalendarController();

// Export controller methods
module.exports = {
    // Event Management
    getEvents: calendarController.getEvents.bind(calendarController),
    createEvent: calendarController.createEvent.bind(calendarController),
    updateEvent: calendarController.updateEvent.bind(calendarController),
    deleteEvent: calendarController.deleteEvent.bind(calendarController),
    
    // Availability
    checkAvailability: calendarController.checkAvailability.bind(calendarController),
    
    // Resources
    getResources: calendarController.getResources.bind(calendarController),
    
    // Statistics
    getTodayStats: calendarController.getTodayStats.bind(calendarController),

    // Export utilities for testing
    CalendarService,
    ValidationUtils,
    UpdateHandler,
    UPDATE_TYPES,
    STATUS_COLORS,
    EVENT_STATUS
};