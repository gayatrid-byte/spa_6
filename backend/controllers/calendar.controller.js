const db = require('../config/database');
const logger = require('../utils/logger');
const { getIo } = require('../websocket');

/**
 * Calendar Controller - Main scheduling engine
 */
class CalendarController {
    /**
     * Get calendar data for a specific view
     */
    async getCalendarView(req, res) {
        try {
            const { viewType } = req.params;
            const { startDate, endDate, staffId, resourceId, serviceId } = req.query;
            const salonId = req.user.salon_id || 1;
            const userId = req.user.id;
            
            // Validate view type
            const validViews = ['day', 'week', 'month', 'staff', 'resource', 'list'];
            if (!validViews.includes(viewType)) {
                return res.status(400).json({ error: 'Invalid view type' });
            }
            
            // Build date range based on view type
            const dateRange = this.buildDateRange(viewType, startDate, endDate);
            
            // Get appointments for the date range
            const appointments = await this.getAppointmentsForRange(salonId, dateRange.start, dateRange.end, {
                staffId: staffId ? parseInt(staffId) : null,
                resourceId: resourceId ? parseInt(resourceId) : null,
                serviceId: serviceId ? parseInt(serviceId) : null
            });
            
            // Get calendar events
            const events = await this.getCalendarEvents(salonId, dateRange.start, dateRange.end);
            
            // Get blocked slots
            const blocks = await this.getBlockedSlots(salonId, dateRange.start, dateRange.end);
            
            // Get staff availability
            const staffAvailability = await this.getStaffAvailability(salonId);
            
            // Get resources
            const resources = await this.getResources(salonId);
            
            // Calculate available slots
            const availableSlots = await this.calculateAvailableSlots(
                salonId, 
                dateRange.start, 
                dateRange.end,
                appointments,
                blocks,
                staffAvailability
            );
            
            // Calculate metrics
            const metrics = this.calculateCalendarMetrics(appointments, dateRange.start, dateRange.end);
            
            res.json({
                success: true,
                data: {
                    viewType,
                    dateRange: {
                        start: dateRange.start.toISOString(),
                        end: dateRange.end.toISOString()
                    },
                    appointments,
                    events,
                    blocks,
                    staffAvailability,
                    resources,
                    availableSlots,
                    metrics
                }
            });
            
        } catch (error) {
            logger.error('Get calendar view error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to load calendar data',
                details: error.message 
            });
        }
    }
    
    /**
     * Quick booking flow
     */
    async quickBook(req, res) {
        try {
            const {
                customerId,
                serviceIds,
                appointmentDate,
                appointmentTime,
                duration,
                staffId,
                resourceId,
                notes,
                sendNotifications
            } = req.body;
            
            const salonId = req.user.salon_id || 1;
            const userId = req.user.id;
            
            // Validate required fields
            if (!customerId || !serviceIds || !appointmentDate || !appointmentTime || !duration) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing required fields: customerId, serviceIds, appointmentDate, appointmentTime, duration' 
                });
            }
            
            // Parse date and time
            const startTime = new Date(`${appointmentDate}T${appointmentTime}`);
            const endTime = new Date(startTime.getTime() + duration * 60000);
            
            // Check availability
            const isAvailable = await this.checkAvailability(
                salonId,
                startTime,
                endTime,
                staffId,
                resourceId
            );
            
            if (!isAvailable) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Selected time slot is not available' 
                });
            }
            
            // Create appointment
            const appointmentData = {
                salon_id: salonId,
                customer_id: customerId,
                service_id: serviceIds[0], // Primary service
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                duration: duration,
                staff_id: staffId,
                resource_id: resourceId,
                notes: notes,
                status: 'scheduled',
                color_code: this.getServiceColor(serviceIds[0]),
                created_by: userId
            };
            
            const [appointmentResult] = await db.execute(
                `INSERT INTO appointments SET ?`,
                [appointmentData]
            );
            
            const appointmentId = appointmentResult.insertId;
            
            // Link services to appointment
            for (const serviceId of (Array.isArray(serviceIds) ? serviceIds : [serviceIds])) {
                await db.execute(
                    `INSERT INTO appointment_services (appointment_id, service_id) VALUES (?, ?)`,
                    [appointmentId, serviceId]
                );
            }
            
            // Send real-time notification via WebSocket
            const io = getIo();
            if (io) {
                io.to(`salon_${salonId}`).emit('appointment.created', {
                    appointmentId,
                    customerId,
                    staffId,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    createdBy: userId
                });
            }
            
            // Log audit
            await this.logAudit(
                salonId,
                userId,
                'create',
                'appointment',
                appointmentId,
                { appointmentData }
            );
            
            res.json({
                success: true,
                message: 'Appointment booked successfully',
                data: {
                    appointmentId: appointmentId,
                    appointmentDetails: {
                        appointmentDate,
                        appointmentTime,
                        duration,
                        services: serviceIds
                    }
                }
            });
            
        } catch (error) {
            logger.error('Quick book error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to create booking',
                details: error.message 
            });
        }
    }
    
    /**
     * Calculate available time slots
     */
    async getAvailability(req, res) {
        try {
            const {
                date,
                serviceIds,
                staffId,
                resourceType,
                duration
            } = req.query;
            
            const salonId = req.user.salon_id || 1;
            
            if (!date) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Date is required' 
                });
            }
            
            // Get required service duration if not provided
            let requiredDuration = parseInt(duration) || 60; // Default 60 minutes
            
            if (serviceIds && !duration) {
                // Calculate total duration from services
                const serviceIdList = serviceIds.split(',').map(id => parseInt(id));
                const [services] = await db.execute(
                    `SELECT SUM(duration) as total_duration FROM services WHERE id IN (?)`,
                    [serviceIdList]
                );
                requiredDuration = services[0]?.total_duration || 60;
            }
            
            // Get calendar settings for business hours
            const [settings] = await db.execute(
                `SELECT start_hour, end_hour, time_slot_duration FROM calendar_settings WHERE salon_id = ? LIMIT 1`,
                [salonId]
            );
            
            const businessHours = {
                start: settings[0]?.start_hour || '08:00:00',
                end: settings[0]?.end_hour || '21:00:00',
                slotDuration: settings[0]?.time_slot_duration || 15
            };
            
            // Get existing appointments for the date
            const appointments = await this.getAppointmentsForDate(salonId, date, staffId);
            
            // Get blocked slots
            const blocks = await this.getBlockedSlotsForDate(salonId, date);
            
            // Get staff availability
            const staffAvailability = await this.getStaffAvailabilityForDate(salonId, date, staffId);
            
            // Calculate available slots
            const availableSlots = this.calculateSlots(
                businessHours,
                appointments,
                blocks,
                staffAvailability,
                requiredDuration
            );
            
            // Sort slots by time
            const sortedSlots = availableSlots.sort((a, b) => 
                new Date(a.start) - new Date(b.start)
            );
            
            // Group slots by time of day
            const groupedSlots = this.groupSlotsByTime(sortedSlots);
            
            res.json({
                success: true,
                data: {
                    date,
                    availableSlots: sortedSlots,
                    groupedSlots,
                    businessHours,
                    totalSlots: sortedSlots.length,
                    requiredDuration
                }
            });
            
        } catch (error) {
            logger.error('Get availability error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to calculate availability',
                details: error.message 
            });
        }
    }
    
    /**
     * Bulk operations on appointments
     */
    async bulkUpdate(req, res) {
        try {
            const { operation, appointmentIds, data } = req.body;
            const salonId = req.user.salon_id || 1;
            const userId = req.user.id;
            
            if (!operation || !appointmentIds || !Array.isArray(appointmentIds)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid request: operation and appointmentIds array required' 
                });
            }
            
            const validOperations = ['reschedule', 'cancel', 'confirm', 'check_in', 'check_out', 'assign_staff', 'assign_resource'];
            if (!validOperations.includes(operation)) {
                return res.status(400).json({ 
                    success: false,
                    error: `Invalid operation. Valid operations: ${validOperations.join(', ')}` 
                });
            }
            
            let results = [];
            let errors = [];
            
            // Process each appointment
            for (const appointmentId of appointmentIds) {
                try {
                    // Verify appointment belongs to salon
                    const [appointment] = await db.execute(
                        `SELECT * FROM appointments WHERE id = ? AND salon_id = ?`,
                        [appointmentId, salonId]
                    );
                    
                    if (appointment.length === 0) {
                        errors.push({ appointmentId, error: 'Appointment not found or access denied' });
                        continue;
                    }
                    
                    let result;
                    switch (operation) {
                        case 'reschedule':
                            result = await this.rescheduleAppointment(appointmentId, data, userId);
                            break;
                        case 'cancel':
                            result = await this.cancelAppointment(appointmentId, data?.reason, userId);
                            break;
                        case 'confirm':
                            result = await this.confirmAppointment(appointmentId, userId);
                            break;
                        case 'check_in':
                            result = await this.checkInAppointment(appointmentId, userId);
                            break;
                        case 'check_out':
                            result = await this.checkOutAppointment(appointmentId, userId);
                            break;
                        case 'assign_staff':
                            result = await this.assignStaff(appointmentId, data.staffId, userId);
                            break;
                        case 'assign_resource':
                            result = await this.assignResource(appointmentId, data.resourceId, userId);
                            break;
                    }
                    
                    results.push({ appointmentId, success: true, result });
                    
                } catch (error) {
                    errors.push({ appointmentId, error: error.message });
                }
            }
            
            res.json({
                success: true,
                data: {
                    processed: appointmentIds.length,
                    results,
                    errors
                }
            });
            
        } catch (error) {
            logger.error('Bulk update error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to process bulk operation',
                details: error.message 
            });
        }
    }
    
    /**
     * Get calendar analytics
     */
    async getAnalytics(req, res) {
        try {
            const { startDate, endDate, staffId, serviceId } = req.query;
            const salonId = req.user.salon_id || 1;
            
            // Set default date range (last 30 days)
            const defaultEnd = new Date();
            const defaultStart = new Date();
            defaultStart.setDate(defaultStart.getDate() - 30);
            
            const dateRange = {
                start: startDate || defaultStart.toISOString().split('T')[0],
                end: endDate || defaultEnd.toISOString().split('T')[0]
            };
            
            // Get analytics data
            const appointments = await this.getAppointmentsForRange(
                salonId, 
                dateRange.start, 
                dateRange.end,
                { staffId, serviceId }
            );
            
            const metrics = this.calculateAnalyticsMetrics(appointments, dateRange);
            
            // Get peak hours
            const peakHours = await this.getPeakHours(salonId, dateRange.start, dateRange.end);
            
            // Get staff performance
            const staffPerformance = await this.getStaffPerformance(salonId, dateRange.start, dateRange.end);
            
            // Get resource utilization
            const resourceUtilization = await this.getResourceUtilization(salonId, dateRange.start, dateRange.end);
            
            res.json({
                success: true,
                data: {
                    dateRange,
                    metrics,
                    peakHours,
                    staffPerformance,
                    resourceUtilization,
                    appointmentsSummary: {
                        total: appointments.length,
                        byStatus: this.groupByStatus(appointments),
                        byService: await this.groupByService(appointments)
                    }
                }
            });
            
        } catch (error) {
            logger.error('Get analytics error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to load analytics',
                details: error.message 
            });
        }
    }
    
    /**
     * External calendar sync
     */
    async syncExternalCalendar(req, res) {
        try {
            const { service, action, calendarId, syncToken } = req.body;
            const salonId = req.user.salon_id || 1;
            const userId = req.user.id;
            
            if (!service || !action) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Service and action are required' 
                });
            }
            
            let result;
            
            switch (service) {
                case 'google_calendar':
                    result = await this.syncGoogleCalendar(salonId, userId, action, calendarId, syncToken);
                    break;
                case 'outlook':
                    result = await this.syncOutlookCalendar(salonId, userId, action, calendarId, syncToken);
                    break;
                default:
                    return res.status(400).json({ 
                        success: false,
                        error: 'Unsupported calendar service. Supported: google_calendar, outlook' 
                    });
            }
            
            res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('External calendar sync error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to sync calendar',
                details: error.message 
            });
        }
    }
    
    /**
     * Resource management
     */
    async manageResources(req, res) {
        try {
            const salonId = req.user.salon_id || 1;
            const { action, resourceId, data } = req.body;
            
            if (!action) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Action is required' 
                });
            }
            
            let result;
            
            switch (action) {
                case 'create':
                    result = await this.createResource(salonId, data);
                    break;
                case 'update':
                    if (!resourceId) {
                        return res.status(400).json({ 
                            success: false,
                            error: 'Resource ID is required for update' 
                        });
                    }
                    result = await this.updateResource(resourceId, salonId, data);
                    break;
                case 'delete':
                    if (!resourceId) {
                        return res.status(400).json({ 
                            success: false,
                            error: 'Resource ID is required for delete' 
                        });
                    }
                    result = await this.deleteResource(resourceId, salonId);
                    break;
                case 'get':
                    result = await this.getResources(salonId, resourceId);
                    break;
                default:
                    return res.status(400).json({ 
                        success: false,
                        error: 'Invalid action. Valid: create, update, delete, get' 
                    });
            }
            
            res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('Resource management error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to manage resources',
                details: error.message 
            });
        }
    }
    
    /**
     * Booking rules engine
     */
    async manageBookingRules(req, res) {
        try {
            const salonId = req.user.salon_id || 1;
            const { action, ruleId, data } = req.body;
            
            if (!action) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Action is required' 
                });
            }
            
            let result;
            
            switch (action) {
                case 'create':
                    result = await this.createBookingRule(salonId, data);
                    break;
                case 'update':
                    if (!ruleId) {
                        return res.status(400).json({ 
                            success: false,
                            error: 'Rule ID is required for update' 
                        });
                    }
                    result = await this.updateBookingRule(ruleId, salonId, data);
                    break;
                case 'delete':
                    if (!ruleId) {
                        return res.status(400).json({ 
                            success: false,
                            error: 'Rule ID is required for delete' 
                        });
                    }
                    result = await this.deleteBookingRule(ruleId, salonId);
                    break;
                case 'validate':
                    result = await this.validateBookingRule(salonId, data);
                    break;
                case 'get':
                    result = await this.getBookingRules(salonId, ruleId);
                    break;
                default:
                    return res.status(400).json({ 
                        success: false,
                        error: 'Invalid action. Valid: create, update, delete, validate, get' 
                    });
            }
            
            res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('Booking rules error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to manage booking rules',
                details: error.message 
            });
        }
    }
    
    // ====================== HELPER METHODS ======================
    
    /**
     * Build date range based on view type
     */
    buildDateRange(viewType, startDate, endDate) {
        const now = new Date();
        
        switch (viewType) {
            case 'day':
                const day = startDate ? new Date(startDate) : now;
                day.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                return { start: day, end: dayEnd };
                
            case 'week':
                const weekStart = startDate ? new Date(startDate) : new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                return { start: weekStart, end: weekEnd };
                
            case 'month':
                const monthStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                return { start: monthStart, end: monthEnd };
                
            default:
                const defaultStart = startDate ? new Date(startDate) : now;
                defaultStart.setHours(0, 0, 0, 0);
                const defaultEnd = endDate ? new Date(endDate) : new Date(defaultStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                defaultEnd.setHours(23, 59, 59, 999);
                return { start: defaultStart, end: defaultEnd };
        }
    }
    
    /**
     * Get appointments for date range
     */
    async getAppointmentsForRange(salonId, startDate, endDate, filters = {}) {
        let query = `
            SELECT a.*, 
                   c.name as customer_name,
                   c.phone as customer_phone,
                   u.name as staff_name,
                   r.name as resource_name,
                   s.name as service_name,
                   GROUP_CONCAT(DISTINCT s2.name) as all_service_names
            FROM appointments a
            LEFT JOIN customers c ON a.customer_id = c.id
            LEFT JOIN users u ON a.staff_id = u.id
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
            LEFT JOIN services s2 ON aps.service_id = s2.id
            WHERE a.salon_id = ?
            AND DATE(CONCAT(a.appointment_date, ' ', a.appointment_time)) >= ?
            AND DATE(CONCAT(a.appointment_date, ' ', a.appointment_time)) <= ?
        `;
        
        const params = [salonId, startDate, endDate];
        
        // Apply filters
        if (filters.staffId) {
            query += ` AND a.staff_id = ?`;
            params.push(filters.staffId);
        }
        
        if (filters.resourceId) {
            query += ` AND a.resource_id = ?`;
            params.push(filters.resourceId);
        }
        
        if (filters.serviceId) {
            query += ` AND EXISTS (
                SELECT 1 FROM appointment_services aps2 
                WHERE aps2.appointment_id = a.id 
                AND aps2.service_id = ?
            )`;
            params.push(filters.serviceId);
        }
        
        query += ` GROUP BY a.id ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
        
        const [appointments] = await db.execute(query, params);
        return appointments;
    }
    
    /**
     * Get appointments for specific date
     */
    async getAppointmentsForDate(salonId, date, staffId = null) {
        let query = `
            SELECT * FROM appointments 
            WHERE salon_id = ? 
            AND appointment_date = ?
        `;
        
        const params = [salonId, date];
        
        if (staffId) {
            query += ` AND staff_id = ?`;
            params.push(staffId);
        }
        
        query += ` ORDER BY appointment_time ASC`;
        
        const [appointments] = await db.execute(query, params);
        return appointments;
    }
    
    /**
     * Get calendar events
     */
    async getCalendarEvents(salonId, startDate, endDate) {
        const [events] = await db.execute(
            `SELECT * FROM calendar_events 
             WHERE salon_id = ? 
             AND ((start_datetime BETWEEN ? AND ?) 
                  OR (end_datetime BETWEEN ? AND ?)
                  OR (start_datetime <= ? AND end_datetime >= ?))
             ORDER BY start_datetime ASC`,
            [salonId, startDate, endDate, startDate, endDate, startDate, endDate]
        );
        return events;
    }
    
    /**
     * Get blocked slots
     */
    async getBlockedSlots(salonId, startDate, endDate) {
        const [blocks] = await db.execute(
            `SELECT * FROM blocked_slots 
             WHERE salon_id = ? 
             AND ((start_datetime BETWEEN ? AND ?) 
                  OR (end_datetime BETWEEN ? AND ?)
                  OR (start_datetime <= ? AND end_datetime >= ?))
             ORDER BY start_datetime ASC`,
            [salonId, startDate, endDate, startDate, endDate, startDate, endDate]
        );
        return blocks;
    }
    
    /**
     * Get blocked slots for specific date
     */
    async getBlockedSlotsForDate(salonId, date) {
        const [blocks] = await db.execute(
            `SELECT * FROM blocked_slots 
             WHERE salon_id = ? 
             AND DATE(start_datetime) = ?
             ORDER BY start_datetime ASC`,
            [salonId, date]
        );
        return blocks;
    }
    
    /**
     * Get staff availability
     */
    async getStaffAvailability(salonId) {
        const [availability] = await db.execute(
            `SELECT sa.*, u.name as staff_name 
             FROM staff_availability sa
             JOIN users u ON sa.staff_id = u.id
             WHERE u.salon_id = ? AND u.role = 'staff'
             ORDER BY u.name, sa.day_of_week`,
            [salonId]
        );
        return availability;
    }
    
    /**
     * Get staff availability for specific date
     */
    async getStaffAvailabilityForDate(salonId, date, staffId = null) {
        const dayOfWeek = new Date(date).getDay();
        
        let query = `
            SELECT sa.*, u.name as staff_name 
            FROM staff_availability sa
            JOIN users u ON sa.staff_id = u.id
            WHERE u.salon_id = ? 
            AND u.role = 'staff'
            AND sa.day_of_week = ?
        `;
        
        const params = [salonId, dayOfWeek];
        
        if (staffId) {
            query += ` AND sa.staff_id = ?`;
            params.push(staffId);
        }
        
        query += ` ORDER BY u.name`;
        
        const [availability] = await db.execute(query, params);
        return availability;
    }
    
    /**
     * Get resources
     */
    async getResources(salonId, resourceId = null) {
        let query = `SELECT * FROM resources WHERE salon_id = ?`;
        const params = [salonId];
        
        if (resourceId) {
            query += ` AND id = ?`;
            params.push(resourceId);
        }
        
        query += ` ORDER BY type, name`;
        
        const [resources] = await db.execute(query, params);
        return resources;
    }
    
    /**
     * Calculate available slots
     */
    async calculateAvailableSlots(salonId, startDate, endDate, appointments, blocks, staffAvailability) {
        // This is a simplified version - real implementation would be more complex
        const slots = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        // Get calendar settings for slot duration
        const [settings] = await db.execute(
            `SELECT time_slot_duration, start_hour, end_hour FROM calendar_settings WHERE salon_id = ? LIMIT 1`,
            [salonId]
        );
        
        const slotDuration = settings[0]?.time_slot_duration || 15; // minutes
        const startHour = settings[0]?.start_hour || '08:00:00';
        const endHour = settings[0]?.end_hour || '21:00:00';
        
        // Generate slots for each day in range
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            
            // Generate time slots for this day
            const daySlots = await this.generateDaySlots(
                dateStr,
                startHour,
                endHour,
                slotDuration,
                appointments.filter(a => a.appointment_date === dateStr),
                blocks.filter(b => b.start_datetime.toISOString().split('T')[0] === dateStr),
                staffAvailability
            );
            
            slots.push(...daySlots);
            
            // Move to next day
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
        }
        
        return slots;
    }
    
    /**
     * Generate time slots for a single day
     */
    async generateDaySlots(dateStr, startHour, endHour, slotDuration, dayAppointments, dayBlocks, staffAvailability) {
        const slots = [];
        const startTime = new Date(`${dateStr}T${startHour}`);
        const endTime = new Date(`${dateStr}T${endHour}`);
        
        let current = new Date(startTime);
        
        while (current < endTime) {
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);
            
            // Check if slot is available
            const isAvailable = this.isSlotAvailable(
                current, 
                slotEnd, 
                dayAppointments, 
                dayBlocks, 
                staffAvailability
            );
            
            if (isAvailable) {
                slots.push({
                    start: new Date(current),
                    end: slotEnd,
                    duration: slotDuration,
                    isPeak: this.isPeakHour(current),
                    recommended: this.isRecommendedTime(current)
                });
            }
            
            current.setTime(current.getTime() + slotDuration * 60000);
        }
        
        return slots;
    }
    
    /**
     * Check if slot is available
     */
    isSlotAvailable(slotStart, slotEnd, appointments, blocks, staffAvailability) {
        // Check against appointments
        for (const appointment of appointments) {
            const apptStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
            const apptEnd = new Date(apptStart.getTime() + (appointment.duration || 60) * 60000);
            
            if (slotStart < apptEnd && slotEnd > apptStart) {
                return false; // Overlap with existing appointment
            }
        }
        
        // Check against blocked slots
        for (const block of blocks) {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            
            if (slotStart < blockEnd && slotEnd > blockStart) {
                return false; // Slot is blocked
            }
        }
        
        return true;
    }
    
    /**
     * Check availability for specific time
     */
    async checkAvailability(salonId, startTime, endTime, staffId, resourceId) {
        const dateStr = startTime.toISOString().split('T')[0];
        const timeStr = startTime.toTimeString().split(' ')[0];
        
        // Check for existing appointments
        let query = `
            SELECT COUNT(*) as count FROM appointments 
            WHERE salon_id = ? 
            AND appointment_date = ?
            AND (
                (appointment_time <= ? AND DATE_ADD(CONCAT(appointment_date, ' ', appointment_time), INTERVAL duration MINUTE) > ?)
                OR (appointment_time >= ? AND appointment_time < ?)
            )
        `;
        
        const params = [salonId, dateStr, timeStr, endTime.toISOString().split('T')[1], timeStr, endTime.toISOString().split('T')[1]];
        
        if (staffId) {
            query += ` AND staff_id = ?`;
            params.push(staffId);
        }
        
        if (resourceId) {
            query += ` AND resource_id = ?`;
            params.push(resourceId);
        }
        
        const [existing] = await db.execute(query, params);
        
        return existing[0].count === 0;
    }
    
    /**
     * Calculate slots based on business hours and constraints
     */
    calculateSlots(businessHours, appointments, blocks, staffAvailability, requiredDuration) {
        const slots = [];
        const slotDuration = businessHours.slotDuration;
        
        // Parse business hours
        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);
        
        // For each potential start time
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                if (hour === endHour && minute >= endMinute) break;
                
                const slotStart = new Date();
                slotStart.setHours(hour, minute, 0, 0);
                const slotEnd = new Date(slotStart.getTime() + requiredDuration * 60000);
                
                // Check if this slot fits within business hours
                if (slotEnd.getHours() > endHour || 
                    (slotEnd.getHours() === endHour && slotEnd.getMinutes() > endMinute)) {
                    continue;
                }
                
                // Check if slot is available
                if (this.isSlotAvailableSimple(slotStart, slotEnd, appointments, blocks)) {
                    slots.push({
                        start: new Date(slotStart),
                        end: new Date(slotEnd),
                        duration: requiredDuration,
                        isPeak: this.isPeakHour(slotStart),
                        recommended: this.isRecommendedTime(slotStart)
                    });
                }
            }
        }
        
        return slots;
    }
    
    /**
     * Simple slot availability check
     */
    isSlotAvailableSimple(slotStart, slotEnd, appointments, blocks) {
        // Check against appointments
        for (const appointment of appointments) {
            const apptStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
            const apptEnd = new Date(apptStart.getTime() + (appointment.duration || 60) * 60000);
            
            if (slotStart < apptEnd && slotEnd > apptStart) {
                return false;
            }
        }
        
        // Check against blocks
        for (const block of blocks) {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            
            if (slotStart < blockEnd && slotEnd > blockStart) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Group slots by time of day
     */
    groupSlotsByTime(slots) {
        const groups = {
            morning: [], // 6am - 12pm
            afternoon: [], // 12pm - 5pm
            evening: [] // 5pm - 10pm
        };
        
        for (const slot of slots) {
            const hour = slot.start.getHours();
            
            if (hour < 12) {
                groups.morning.push(slot);
            } else if (hour < 17) {
                groups.afternoon.push(slot);
            } else {
                groups.evening.push(slot);
            }
        }
        
        return groups;
    }
    
    /**
     * Calculate calendar metrics
     */
    calculateCalendarMetrics(appointments, startDate, endDate) {
        const now = new Date();
        const metrics = {
            total: appointments.length,
            completed: 0,
            scheduled: 0,
            cancelled: 0,
            no_show: 0,
            revenue: 0,
            averageDuration: 0,
            utilization: 0
        };
        
        let totalDuration = 0;
        
        for (const appointment of appointments) {
            switch (appointment.status) {
                case 'completed':
                    metrics.completed++;
                    break;
                case 'scheduled':
                    metrics.scheduled++;
                    break;
                case 'cancelled':
                    metrics.cancelled++;
                    break;
                case 'no-show':
                    metrics.no_show++;
                    break;
            }
            
            // Calculate duration in minutes
            totalDuration += appointment.duration || 60;
        }
        
        if (appointments.length > 0) {
            metrics.averageDuration = Math.round(totalDuration / appointments.length);
            
            // Simplified utilization calculation
            const businessHoursPerDay = 10; // Assume 10 business hours per day
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            const availableMinutes = businessHoursPerDay * 60 * days;
            
            metrics.utilization = Math.round((totalDuration / availableMinutes) * 100);
        }
        
        return metrics;
    }
    
    /**
     * Calculate analytics metrics
     */
    calculateAnalyticsMetrics(appointments, dateRange) {
        const metrics = {
            totalBookings: appointments.length,
            totalRevenue: 0,
            averageBookingValue: 0,
            cancellationRate: 0,
            noShowRate: 0,
            utilizationRate: 0
        };
        
        // Group by status
        const statusCounts = {};
        let completedCount = 0;
        
        for (const appointment of appointments) {
            statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1;
            
            if (appointment.status === 'completed') {
                completedCount++;
            }
        }
        
        // Calculate rates
        metrics.cancellationRate = appointments.length > 0 
            ? Math.round((statusCounts.cancelled || 0) / appointments.length * 100) 
            : 0;
            
        metrics.noShowRate = appointments.length > 0 
            ? Math.round((statusCounts['no-show'] || 0) / appointments.length * 100) 
            : 0;
            
        metrics.utilizationRate = appointments.length > 0 
            ? Math.round((completedCount / appointments.length) * 100) 
            : 0;
        
        return metrics;
    }
    
    /**
     * Get peak hours
     */
    async getPeakHours(salonId, startDate, endDate) {
        const [hourlyData] = await db.execute(
            `SELECT 
                HOUR(appointment_time) as hour,
                COUNT(*) as bookings
             FROM appointments 
             WHERE salon_id = ? 
             AND appointment_date >= ? 
             AND appointment_date <= ?
             AND status != 'cancelled'
             GROUP BY HOUR(appointment_time)
             ORDER BY bookings DESC`,
            [salonId, startDate, endDate]
        );
        
        return hourlyData;
    }
    
    /**
     * Get staff performance
     */
    async getStaffPerformance(salonId, startDate, endDate) {
        const [performance] = await db.execute(
            `SELECT 
                u.id,
                u.name,
                COUNT(a.id) as total_appointments,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                AVG(a.duration) as avg_duration
             FROM users u
             LEFT JOIN appointments a ON u.id = a.staff_id 
             AND a.appointment_date >= ? 
             AND a.appointment_date <= ?
             WHERE u.salon_id = ? 
             AND u.role = 'staff'
             GROUP BY u.id, u.name
             ORDER BY completed DESC`,
            [startDate, endDate, salonId]
        );
        
        return performance;
    }
    
    /**
     * Get resource utilization
     */
    async getResourceUtilization(salonId, startDate, endDate) {
        const [utilization] = await db.execute(
            `SELECT 
                r.id,
                r.name,
                r.type,
                COUNT(a.id) as total_bookings,
                SUM(a.duration) as total_minutes
             FROM resources r
             LEFT JOIN appointments a ON r.id = a.resource_id 
             AND a.appointment_date >= ? 
             AND a.appointment_date <= ?
             AND a.status != 'cancelled'
             WHERE r.salon_id = ?
             GROUP BY r.id, r.name, r.type
             ORDER BY total_minutes DESC`,
            [startDate, endDate, salonId]
        );
        
        return utilization;
    }
    
    /**
     * Group appointments by status
     */
    groupByStatus(appointments) {
        return appointments.reduce((groups, appointment) => {
            const status = appointment.status || 'unknown';
            groups[status] = (groups[status] || 0) + 1;
            return groups;
        }, {});
    }
    
    /**
     * Group appointments by service
     */
    async groupByService(appointments) {
        if (appointments.length === 0) return {};
        
        const appointmentIds = appointments.map(a => a.id);
        const [serviceData] = await db.execute(
            `SELECT 
                aps.appointment_id,
                s.name as service_name
             FROM appointment_services aps
             JOIN services s ON aps.service_id = s.id
             WHERE aps.appointment_id IN (?)`,
            [appointmentIds]
        );
        
        const groups = {};
        for (const data of serviceData) {
            groups[data.service_name] = (groups[data.service_name] || 0) + 1;
        }
        
        return groups;
    }
    
    /**
     * Check if time is peak hour
     */
    isPeakHour(time) {
        const hour = time.getHours();
        // Peak hours: 11AM-1PM, 5PM-7PM
        return (hour >= 11 && hour < 13) || (hour >= 17 && hour < 19);
    }
    
    /**
     * Check if time is recommended
     */
    isRecommendedTime(time) {
        const hour = time.getHours();
        const day = time.getDay();
        
        // Recommended: Morning on weekdays
        return hour >= 9 && hour < 11 && day >= 1 && day <= 5;
    }
    
    /**
     * Get service color
     */
    getServiceColor(serviceId) {
        // Simple hash-based color generation
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
        ];
        const index = serviceId % colors.length;
        return colors[index];
    }
    
    /**
     * Reschedule appointment
     */
    async rescheduleAppointment(appointmentId, data, userId) {
        const { appointmentDate, appointmentTime, reason } = data;
        
        // Get current appointment
        const [appointments] = await db.execute(
            `SELECT * FROM appointments WHERE id = ?`,
            [appointmentId]
        );
        
        if (appointments.length === 0) {
            throw new Error('Appointment not found');
        }
        
        const appointment = appointments[0];
        
        // Update appointment
        await db.execute(
            `UPDATE appointments SET 
                appointment_date = ?,
                appointment_time = ?,
                original_start_time = CONCAT(?, ' ', ?),
                updated_at = NOW()
             WHERE id = ?`,
            [appointmentDate, appointmentTime, appointment.appointment_date, appointment.appointment_time, appointmentId]
        );
        
        // Log audit
        await this.logAudit(
            appointment.salon_id,
            userId,
            'reschedule',
            'appointment',
            appointmentId,
            {
                oldDate: appointment.appointment_date,
                oldTime: appointment.appointment_time,
                newDate: appointmentDate,
                newTime: appointmentTime,
                reason
            }
        );
        
        return { success: true, message: 'Appointment rescheduled' };
    }
    
    /**
     * Cancel appointment
     */
    async cancelAppointment(appointmentId, reason, userId) {
        // Get appointment
        const [appointments] = await db.execute(
            `SELECT * FROM appointments WHERE id = ?`,
            [appointmentId]
        );
        
        if (appointments.length === 0) {
            throw new Error('Appointment not found');
        }
        
        const appointment = appointments[0];
        
        // Update appointment status
        await db.execute(
            `UPDATE appointments SET 
                status = 'cancelled',
                updated_at = NOW()
             WHERE id = ?`,
            [appointmentId]
        );
        
        // Log audit
        await this.logAudit(
            appointment.salon_id,
            userId,
            'cancel',
            'appointment',
            appointmentId,
            { reason }
        );
        
        return { success: true, message: 'Appointment cancelled' };
    }
    
    /**
     * Confirm appointment
     */
    async confirmAppointment(appointmentId, userId) {
        await db.execute(
            `UPDATE appointments SET 
                status = 'scheduled',
                updated_at = NOW()
             WHERE id = ?`,
            [appointmentId]
        );
        
        return { success: true, message: 'Appointment confirmed' };
    }
    
    /**
     * Check in appointment
     */
    async checkInAppointment(appointmentId, userId) {
        await db.execute(
            `UPDATE appointments SET 
                status = 'completed',
                updated_at = NOW()
             WHERE id = ?`,
            [appointmentId]
        );
        
        return { success: true, message: 'Customer checked in' };
    }
    
    /**
     * Check out appointment
     */
    async checkOutAppointment(appointmentId, userId) {
        // Already completed during check-in
        return { success: true, message: 'Customer checked out' };
    }
    
    /**
     * Assign staff to appointment
     */
    async assignStaff(appointmentId, staffId, userId) {
        // Check if staff is available
        const [appointments] = await db.execute(
            `SELECT * FROM appointments WHERE id = ?`,
            [appointmentId]
        );
        
        if (appointments.length === 0) {
            throw new Error('Appointment not found');
        }
        
        const appointment = appointments[0];
        
        // Update staff assignment
        await db.execute(
            `UPDATE appointments SET 
                staff_id = ?,
                updated_at = NOW()
             WHERE id = ?`,
            [staffId, appointmentId]
        );
        
        // Log audit
        await this.logAudit(
            appointment.salon_id,
            userId,
            'update',
            'appointment',
            appointmentId,
            { staffAssigned: staffId }
        );
        
        return { success: true, message: 'Staff assigned' };
    }
    
    /**
     * Assign resource to appointment
     */
    async assignResource(appointmentId, resourceId, userId) {
        // Update resource assignment
        await db.execute(
            `UPDATE appointments SET 
                resource_id = ?,
                updated_at = NOW()
             WHERE id = ?`,
            [resourceId, appointmentId]
        );
        
        return { success: true, message: 'Resource assigned' };
    }
    
    /**
     * Create resource
     */
    async createResource(salonId, data) {
        const [result] = await db.execute(
            `INSERT INTO resources SET ?`,
            [{ salon_id: salonId, ...data }]
        );
        
        return { id: result.insertId, ...data };
    }
    
    /**
     * Update resource
     */
    async updateResource(resourceId, salonId, data) {
        await db.execute(
            `UPDATE resources SET ? WHERE id = ? AND salon_id = ?`,
            [data, resourceId, salonId]
        );
        
        return { id: resourceId, ...data };
    }
    
    /**
     * Delete resource
     */
    async deleteResource(resourceId, salonId) {
        await db.execute(
            `DELETE FROM resources WHERE id = ? AND salon_id = ?`,
            [resourceId, salonId]
        );
        
        return { success: true, message: 'Resource deleted' };
    }
    
    /**
     * Create booking rule
     */
    async createBookingRule(salonId, data) {
        const [result] = await db.execute(
            `INSERT INTO booking_rules SET ?`,
            [{ salon_id: salonId, ...data }]
        );
        
        return { id: result.insertId, ...data };
    }
    
    /**
     * Update booking rule
     */
    async updateBookingRule(ruleId, salonId, data) {
        await db.execute(
            `UPDATE booking_rules SET ? WHERE id = ? AND salon_id = ?`,
            [data, ruleId, salonId]
        );
        
        return { id: ruleId, ...data };
    }
    
    /**
     * Delete booking rule
     */
    async deleteBookingRule(ruleId, salonId) {
        await db.execute(
            `DELETE FROM booking_rules WHERE id = ? AND salon_id = ?`,
            [ruleId, salonId]
        );
        
        return { success: true, message: 'Booking rule deleted' };
    }
    
    /**
     * Validate booking rule
     */
    async validateBookingRule(salonId, data) {
        // Simple validation - check for conflicts
        // In real implementation, this would check all rules
        return { valid: true, message: 'Rule is valid' };
    }
    
    /**
     * Get booking rules
     */
    async getBookingRules(salonId, ruleId = null) {
        let query = `SELECT * FROM booking_rules WHERE salon_id = ?`;
        const params = [salonId];
        
        if (ruleId) {
            query += ` AND id = ?`;
            params.push(ruleId);
        }
        
        query += ` ORDER BY priority DESC`;
        
        const [rules] = await db.execute(query, params);
        return rules;
    }
    
    /**
     * Sync with Google Calendar (placeholder)
     */
    async syncGoogleCalendar(salonId, userId, action, calendarId, syncToken) {
        // Placeholder - would integrate with Google Calendar API
        return { 
            success: true, 
            message: 'Google Calendar sync initiated',
            action,
            lastSynced: new Date().toISOString()
        };
    }
    
    /**
     * Sync with Outlook Calendar (placeholder)
     */
    async syncOutlookCalendar(salonId, userId, action, calendarId, syncToken) {
        // Placeholder - would integrate with Outlook Calendar API
        return { 
            success: true, 
            message: 'Outlook Calendar sync initiated',
            action,
            lastSynced: new Date().toISOString()
        };
    }
    
    /**
     * Log audit trail
     */
    async logAudit(salonId, userId, action, entityType, entityId, changes) {
        try {
            await db.execute(
                `INSERT INTO calendar_audit_log 
                (salon_id, user_id, action, entity_type, entity_id, changes, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [salonId, userId, action, entityType, entityId, JSON.stringify(changes)]
            );
        } catch (error) {
            logger.error('Audit log error:', error);
        }
    }
}

module.exports = new CalendarController();