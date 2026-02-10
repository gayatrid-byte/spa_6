// /**
//  * Calendar Pro v5 - Model (ADAPTED to Existing Database)
//  * Works with existing tables: bookings, customers, services, staff, rooms, memberships
//  */

// const { pool } = require('../config/database');
// const db = pool; // alias for existing query usage

// class CalendarModel {
    
//     // ==================== EVENT MANAGEMENT ====================
    
//     /**
//      * Get all calendar events with filters
//      */
//     async getEvents(filters = {}) {
//         try {
//             let query = `
//                 SELECT
//                     ce.*, 
//                     ce.title AS display_title,
//                     ce.color_code AS computed_color,
//                     c.name AS customer_name,
//                     c.phone AS customer_phone,
//                     c.email AS customer_email,
//                     s.name AS service_name,
//                     st.name AS staff_name,
//                     r.name AS room_name
//                 FROM calendar_events ce
//                 LEFT JOIN customers c ON ce.customer_id = c.id
//                 LEFT JOIN services s ON ce.service_id = s.id
//                 LEFT JOIN staff st ON ce.staff_id = st.id
//                 LEFT JOIN rooms r ON ce.room_id = r.id
//                 WHERE 1=1
//             `;
//             const params = [];
            
//             // Salon filter
//             if (filters.salon_id) {
//                 query += ` AND ce.salon_id = ?`;
//                 params.push(filters.salon_id);
//             }
            
//             // Date range filter
//             if (filters.start_date) {
//                 query += ` AND ce.booking_date >= ?`;
//                 params.push(filters.start_date);
//             }

//             if (filters.end_date) {
//                 query += ` AND ce.booking_date <= ?`;
//                 params.push(filters.end_date);
//             }
            
//             // Staff filter
//             if (filters.staff_id) {
//                 query += ` AND ce.staff_id = ?`;
//                 params.push(filters.staff_id);
//             }
            
//             // Room filter
//             if (filters.room_id) {
//                 query += ` AND ce.room_id = ?`;
//                 params.push(filters.room_id);
//             }
            
//             // Customer filter
//             if (filters.customer_id) {
//                 query += ` AND ce.customer_id = ?`;
//                 params.push(filters.customer_id);
//             }
            
//             // Status filter
//             if (filters.status) {
//                 if (Array.isArray(filters.status)) {
//                     const placeholders = filters.status.map(() => '?').join(',');
//                     query += ` AND ce.status IN (${placeholders})`;
//                     params.push(...filters.status);
//                 } else {
//                     query += ` AND ce.status = ?`;
//                     params.push(filters.status);
//                 }
//             }
            
//             // Event type filter
//             if (filters.event_type) {
//                 query += ` AND ce.event_type = ?`;
//                 params.push(filters.event_type);
//             }
            
//             // Search filter
//             if (filters.search) {
//                 query += ` AND (ce.title LIKE ? OR c.name LIKE ? OR st.name LIKE ? OR s.name LIKE ?)`;
//                 const searchTerm = `%${filters.search}%`;
//                 params.push(searchTerm, searchTerm, searchTerm, searchTerm);
//             }
            
//             // Order by
//             query += ` ORDER BY ce.booking_date ASC, ce.start_time ASC`;
            
//             const [rows] = await pool.query(query, params);
//             return rows;
//         } catch (error) {
//             console.error('Error getting events:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Get single event by ID
//      */
//     async getEventById(id) {
//         try {
//             const [rows] = await pool.query(
//                 `SELECT * FROM v_calendar_events_full WHERE id = ?`,
//                 [id]
//             );
//             return rows[0] || null;
//         } catch (error) {
//             console.error('Error getting event by ID:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Create new calendar event
//      */
//     async createEvent(eventData) {
//         const connection = await pool.getConnection();
        
//         try {
//             await connection.beginTransaction();
            
//             const {
//                 salon_id,
//                 title,
//                 description,
//                 booking_date,
//                 start_time,
//                 end_time,
//                 customer_id,
//                 service_id,
//                 staff_id,
//                 room_id,
//                 membership_id,
//                 event_type,
//                 status,
//                 color_code,
//                 notes,
//                 reminder_minutes,
//                 created_by
//             } = eventData;
            
//             // Insert calendar event
//             const [result] = await connection.query(
//                 `INSERT INTO calendar_events SET 
//                     salon_id = ?, title = ?, description = ?,
//                     booking_date = ?, start_time = ?, end_time = ?,
//                     customer_id = ?, service_id = ?, staff_id = ?, room_id = ?,
//                     membership_id = ?, event_type = ?, status = ?,
//                     color_code = ?, notes = ?, reminder_minutes = ?,
//                     created_by = ?, updated_by = ?`,
//                 [
//                     salon_id, title, description,
//                     booking_date, start_time, end_time,
//                     customer_id, service_id, staff_id, room_id,
//                     membership_id, event_type, status,
//                     color_code, notes, reminder_minutes,
//                     created_by, created_by
//                 ]
//             );
            
//             const eventId = result.insertId;
            
//             // If this is a booking event and no booking_id exists, create booking
//             if (event_type === 'booking' && !eventData.booking_id && customer_id) {
//                 const serviceDuration = await this.getServiceDuration(service_id);
//                 const servicePrice = await this.getServicePrice(serviceId);
                
//                 const [bookingResult] = await connection.query(
//                     `INSERT INTO bookings SET 
//                         salon_id = ?, customer_id = ?, booking_type = 'calling',
//                         booking_date = ?, start_time = ?, end_time = ?,
//                         status = ?, total_amount = ?, created_by = ?`,
//                     [
//                         salon_id, customer_id,
//                         booking_date, start_time, end_time,
//                         status, servicePrice || 0,
//                         created_by
//                     ]
//                 );
                
//                 const bookingId = bookingResult.insertId;
                
//                 // Add booking item
//                 if (service_id) {
//                     await connection.query(
//                         `INSERT INTO booking_items SET 
//                             booking_id = ?, category_id = ?, subcategory_id = ?,
//                             service_id = ?, staff_id = ?, room_id = ?,
//                             duration_minutes = ?, price = ?`,
//                         [
//                             bookingId, 1, 1,
//                             service_id, staff_id, room_id,
//                             serviceDuration || 60, servicePrice || 0
//                         ]
//                     );
//                 }
                
//                 // Link event to booking
//                 await connection.query(
//                     `UPDATE calendar_events SET booking_id = ? WHERE id = ?`,
//                     [bookingId, eventId]
//                 );
//             }
            
//             await connection.commit();
//             return eventId;
//         } catch (error) {
//             await connection.rollback();
//             console.error('Error creating event:', error);
//             throw error;
//         } finally {
//             connection.release();
//         }
//     }
    
//     /**
//      * Update calendar event
//      */
//     async updateEvent(id, eventData) {
//         try {
//             const fields = [];
//             const values = [];
            
//             // Build dynamic update query
//             for (const [key, value] of Object.entries(eventData)) {
//                 if (key === 'id') continue;
//                 if (value !== undefined && value !== null) {
//                     fields.push(`${key} = ?`);
//                     values.push(value);
//                 }
//             }
            
//             if (fields.length === 0) {
//                 return false;
//             }
            
//             fields.push('updated_at = NOW()');
            
//             const query = `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`;
//             values.push(id);
            
//             const [result] = await db.query(query, values);
            
//             // If booking is linked, update it too
//             if (result.affectedRows > 0 && (eventData.booking_date || eventData.start_time || eventData.end_time || eventData.status)) {
//                 const [event] = await pool.query(`SELECT booking_id, status FROM calendar_events WHERE id = ?`, [id]);
//                 if (event[0] && event[0].booking_id) {
//                     const bookingUpdate = {};
//                     if (eventData.booking_date) bookingUpdate.booking_date = eventData.booking_date;
//                     if (eventData.start_time) bookingUpdate.start_time = eventData.start_time;
//                     if (eventData.end_time) bookingUpdate.end_time = eventData.end_time;
//                     if (eventData.status) {
//                         bookingUpdate.status = eventData.status === 'in_service' ? 'in_progress' : eventData.status;
//                     }
                    
//                     await this.updateBooking(event[0].booking_id, bookingUpdate);
//                 }
//             }
            
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error updating event:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Delete calendar event
//      */
//     async deleteEvent(id) {
//         try {
//                 const [event] = await pool.query(`SELECT booking_id, event_type FROM calendar_events WHERE id = ?`, [id]);
            
//             const [result] = await pool.query(
//                 `DELETE FROM calendar_events WHERE id = ?`,
//                 [id]
//             );
            
//             // Don't delete the actual booking, just cancel it
//             if (result.affectedRows > 0 && event[0] && event[0].booking_id) {
//                 await pool.query(
//                     `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
//                     [event[0].booking_id]
//                 );
//             }
            
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error deleting event:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Update event status
//      */
//     async updateEventStatus(id, status) {
//         try {
//             const [event] = await pool.query(`SELECT booking_id FROM calendar_events WHERE id = ?`, [id]);
            
//             const [result] = await pool.query(
//                 `UPDATE calendar_events SET status = ?, updated_at = NOW() WHERE id = ?`,
//                 [status, id]
//             );
            
//             // Sync with booking
//             if (result.affectedRows > 0 && event[0] && event[0].booking_id) {
//                 const bookingStatus = status === 'in_service' ? 'in_progress' : status;
//                 await pool.query(
//                     `UPDATE bookings SET status = ? WHERE id = ?`,
//                     [bookingStatus, event[0].booking_id]
//                 );
//             }
            
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error updating event status:', error);
//             throw error;
//         }
//     }
    
//     // ==================== AVAILABILITY CHECKING ====================
    
//     /**
//      * Check if staff is available at given time
//      */
//     async isStaffAvailable(staffId, date, startTime, endTime, excludeEventId = null) {
//         try {
//             // Check for availability exceptions (leave, breaks, etc.)
//             const [exceptions] = await pool.query(
//                 `SELECT COUNT(*) as count
//                  FROM staff_availability_exceptions
//                  WHERE staff_id = ? 
//                  AND exception_date = ?
//                  AND is_available = FALSE
//                  AND (
//                      (start_time < ? AND end_time > ?)
//                  )`,
//                 [staffId, date, endTime, startTime]
//             );
            
//             if (exceptions[0].count > 0) {
//                 return false;
//             }
            
//             // Check for conflicting calendar events
//             let query = `
//                 SELECT COUNT(*) as count
//                 FROM calendar_events
//                 WHERE staff_id = ?
//                 AND booking_date = ?
//                 AND status NOT IN ('cancelled', 'no_show')
//                 AND (
//                     (start_time < ? AND end_time > ?) OR
//                     (start_time >= ? AND start_time < ?) OR
//                     (end_time > ? AND end_time <= ?)
//                 )
//             `;
//             const params = [staffId, date, endTime, startTime, startTime, endTime, startTime, endTime];
            
//             if (excludeEventId) {
//                 query += ` AND id != ?`;
//                 params.push(excludeEventId);
//             }
            
//             const [conflicts] = await pool.query(query, params);
            
//             return conflicts[0].count === 0;
//         } catch (error) {
//             console.error('Error checking staff availability:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Check if room is available at given time
//      */
//     async isRoomAvailable(roomId, date, startTime, endTime, excludeEventId = null) {
//         try {
//             // Check for room exceptions (maintenance, etc.)
//             const [exceptions] = await pool.query(
//                 `SELECT COUNT(*) as count
//                  FROM room_availability_exceptions
//                  WHERE room_id = ?
//                  AND exception_date = ?
//                  AND status = 'unavailable'
//                  AND (
//                      (start_time < ? AND end_time > ?)
//                  )`,
//                 [roomId, date, endTime, startTime]
//             );
            
//             if (exceptions[0].count > 0) {
//                 return false;
//             }
            
//             // Check for conflicting calendar events
//             let query = `
//                 SELECT COUNT(*) as count
//                 FROM calendar_events
//                 WHERE room_id = ?
//                 AND booking_date = ?
//                 AND status NOT IN ('cancelled', 'no_show')
//                 AND (
//                     (start_time < ? AND end_time > ?) OR
//                     (start_time >= ? AND start_time < ?) OR
//                     (end_time > ? AND end_time <= ?)
//                 )
//             `;
//             const params = [roomId, date, endTime, startTime, startTime, endTime, startTime, endTime];
            
//             if (excludeEventId) {
//                 query += ` AND id != ?`;
//                 params.push(excludeEventId);
//             }
            
//             const [conflicts] = await pool.query(query, params);
            
//             return conflicts[0].count === 0;
//         } catch (error) {
//             console.error('Error checking room availability:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Check for conflicts with existing bookings
//      */
//     async checkConflicts(salonId, date, startTime, endTime, staffId, roomId, excludeEventId = null) {
//         try {
//             let query = `
//                 SELECT 
//                     id,
//                     title,
//                     start_time,
//                     end_time,
//                     staff_id,
//                     room_id,
//                     status,
//                     CASE 
//                         WHEN staff_id = ? THEN 'staff'
//                         WHEN room_id = ? THEN 'room'
//                         ELSE 'both'
//                     END AS conflict_type
//                 FROM calendar_events
//                 WHERE salon_id = ?
//                 AND booking_date = ?
//                 AND status NOT IN ('cancelled', 'no_show')
//                 AND (
//                     (start_time < ? AND end_time > ?) OR
//                     (start_time >= ? AND start_time < ?) OR
//                     (end_time > ? AND end_time <= ?)
//                 )
//             `;
//             const params = [staffId, roomId, salonId, date, endTime, startTime, startTime, endTime, startTime, endTime];
            
//             if (excludeEventId) {
//                 query += ` AND id != ?`;
//                 params.push(excludeEventId);
//             }
            
//             // Filter by staff or room if specified
//             if (staffId) {
//                 query += ` AND staff_id = ?`;
//                 params.push(staffId);
//             }
            
//             if (roomId) {
//                 query += ` AND room_id = ?`;
//                 params.push(roomId);
//             }
            
//             const [conflicts] = await pool.query(query, params);
//             return conflicts;
//         } catch (error) {
//             console.error('Error checking conflicts:', error);
//             throw error;
//         }
//     }
    
//     // ==================== STAFF AVAILABILITY EXCEPTIONS ====================
    
//     /**
//      * Get staff availability exceptions
//      */
//     async getStaffExceptions(staffId, startDate, endDate) {
//         try {
//             let query = `
//                 SELECT * FROM v_staff_schedule
//                 WHERE 1=1
//             `;
//             const params = [];
            
//             if (staffId) {
//                 query += ` AND staff_id = ?`;
//                 params.push(staffId);
//             }
            
//             if (startDate) {
//                 query += ` AND exception_date >= ?`;
//                 params.push(startDate);
//             }
            
//             if (endDate) {
//                 query += ` AND exception_date <= ?`;
//                 params.push(endDate);
//             }
            
//             query += ` ORDER BY exception_date ASC, start_time ASC`;
            
//             const [rows] = await pool.query(query, params);
//             return rows;
//         } catch (error) {
//             console.error('Error getting staff exceptions:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Create staff availability exception
//      */
//     async createStaffException(exceptionData) {
//         try {
//             const {
//                 salon_id, staff_id, exception_date, start_time, end_time,
//                 exception_type, is_available, is_recurring, notes, created_by
//             } = exceptionData;
            
//             const [result] = await pool.query(
//                 `INSERT INTO staff_availability_exceptions SET 
//                     salon_id = ?, staff_id = ?, exception_date = ?,
//                     start_time = ?, end_time = ?, exception_type = ?,
//                     is_available = ?, is_recurring = ?, notes = ?`,
//                 [salon_id, staff_id, exception_date, start_time, end_time, exception_type, is_available, is_recurring, notes]
//             );
            
//             return result.insertId;
//         } catch (error) {
//             console.error('Error creating staff exception:', error);
//             throw error;
//         }
//     }
    
//     // ==================== NOTIFICATIONS ====================
    
//     /**
//      * Create notification
//      */
//     async createNotification(notificationData) {
//         try {
//             const {
//                 salon_id, calendar_event_id, notification_type,
//                 recipient_type, recipient_id, title, message,
//                 status, channel, scheduled_time, recipient_email, recipient_phone, metadata
//             } = notificationData;
            
//             const [result] = await pool.query(
//                 `INSERT INTO calendar_notifications SET 
//                     salon_id = ?, calendar_event_id = ?, notification_type = ?,
//                     recipient_type = ?, recipient_id = ?, title = ?, message = ?,
//                     status = ?, channel = ?, scheduled_time = ?,
//                     recipient_email = ?, recipient_phone = ?, metadata = ?`,
//                 [
//                     salon_id, calendar_event_id, notification_type,
//                     recipient_type, recipient_id, title, message,
//                     status || 'unread', channel || 'in_app', scheduled_time,
//                     recipient_email, recipient_phone,
//                     metadata ? JSON.stringify(metadata) : null
//                 ]
//             );
            
//             return result.insertId;
//         } catch (error) {
//             console.error('Error creating notification:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Get notifications for user
//      */
//     async getNotifications(salonId, recipientType, recipientId, status = null, limit = 50) {
//         try {
//             let query = `
//                 SELECT cn.*, ce.title as event_title, ce.booking_date, ce.start_time
//                 FROM calendar_notifications cn
//                 LEFT JOIN calendar_events ce ON cn.calendar_event_id = ce.id
//                 WHERE cn.salon_id = ?
//                 AND cn.recipient_type = ?
//                 AND cn.recipient_id = ?
//             `;
//             const params = [salonId, recipientType, recipientId];
            
//             if (status) {
//                 if (Array.isArray(status)) {
//                     const placeholders = status.map(() => '?').join(',');
//                     query += ` AND cn.status IN (${placeholders})`;
//                     params.push(...status);
//                 } else {
//                     query += ` AND cn.status = ?`;
//                     params.push(status);
//                 }
//             }
            
//             query += ` ORDER BY cn.created_at DESC LIMIT ?`;
//             params.push(limit);
            
//             const [rows] = await pool.query(query, params);
//             return rows;
//         } catch (error) {
//             console.error('Error getting notifications:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Mark notification as read
//      */
//     async markNotificationRead(id, recipientId) {
//         try {
//             const [result] = await pool.query(
//                 `UPDATE calendar_notifications 
//                  SET status = 'read', read_at = NOW()
//                  WHERE id = ? AND recipient_id = ?`,
//                 [id, recipientId]
//             );
            
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error marking notification as read:', error);
//             throw error;
//         }
//     }
    
//     // ==================== SETTINGS ====================
    
//     /**
//      * Get calendar settings
//      */
//     async getCalendarSettings(salonId) {
//         try {
//             const [rows] = await pool.query(
//                 `SELECT setting_key, setting_value FROM calendar_settings WHERE salon_id = ?`,
//                 [salonId]
//             );
            
//             const settings = {};
//             rows.forEach(row => {
//                 // Parse boolean values
//                 if (row.setting_value === 'true' || row.setting_value === 'false') {
//                     settings[row.setting_key] = row.setting_value === 'true';
//                 } else {
//                     settings[row.setting_key] = row.setting_value;
//                 }
//             });
            
//             // Default settings
//             const defaults = {
//                 'calendar.default_view': 'timeGridWeek',
//                 'calendar.slot_duration_minutes': '30',
//                 'calendar.business_hours_start': '09:00',
//                 'calendar.business_hours_end': '19:00',
//                 'calendar.allow_double_booking': false,
//                 'calendar.enable_notifications': true,
//                 'calendar.notification_minutes_before': '15',
//                 'calendar.color_by': 'status',
//                 'calendar.display_min_time': '08:00',
//                 'calendar.display_max_time': '21:00',
//                 'calendar.show_weekends': true,
//                 'calendar.first_day_of_week': '0'
//             };
            
//             // Merge defaults
//             Object.keys(defaults).forEach(key => {
//                 if (settings[key] === undefined) {
//                     settings[key] = defaults[key];
//                 }
//             });
            
//             return settings;
//         } catch (error) {
//             console.error('Error getting calendar settings:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Update calendar setting
//      */
//     async updateCalendarSetting(salonId, settingKey, settingValue) {
//         try {
//             const [result] = await pool.query(
//                 `INSERT INTO calendar_settings (salon_id, setting_key, setting_value)
//                  VALUES (?, ?, ?)
//                  ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
//                 [salonId, settingKey, settingValue.toString()]
//             );
            
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error updating calendar setting:', error);
//             throw error;
//         }
//     }
    
//     // ==================== STATISTICS ====================
    
//     /**
//      * Get today's statistics
//      */
//     async getTodayStats(salonId) {
//         try {
//             const today = new Date().toISOString().split('T')[0];
            
//             const [rows] = await pool.query(
//                 `SELECT 
//                     COUNT(*) as total_events,
//                     SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_events,
//                     SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_events,
//                     SUM(CASE WHEN status = 'in_service' THEN 1 ELSE 0 END) as in_service_events,
//                     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events,
//                     SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_events,
//                     SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_events,
//                     COUNT(DISTINCT staff_id) as active_staff,
//                     COUNT(DISTINCT room_id) as active_rooms
//                 FROM calendar_events
//                 WHERE salon_id = ? AND booking_date = ?`,
//                 [salonId, today]
//             );
            
//             return rows[0] || {};
//         } catch (error) {
//             console.error('Error getting today stats:', error);
//             throw error;
//         }
//     }
    
//     /**
//      * Get available staff count for today
//      */
//     async getAvailableStaffCount(salonId, date) {
//         try {
//             const [rows] = await db.query(
//                 `SELECT COUNT(DISTINCT st.id) as count
//                 FROM staff st
//                 WHERE st.salon_id = ? 
//                 AND st.status = 'active'
//                 AND st.id NOT IN (
//                     SELECT DISTINCT sae.staff_id
//                     FROM staff_availability_exceptions sae
//                     WHERE sae.exception_date = ?
//                     AND sae.is_available = FALSE
//                 )`,
//                 [salonId, date]
//             );
            
//             return rows[0].count || 0;
//         } catch (error) {
//             console.error('Error getting available staff count:', error);
//             throw error;
//         }
//     }
    
//     // ==================== RESOURCES ====================
    
//     /**
//      * Get calendar resources (staff, rooms, services, customers)
//      */
//     async getResources(salonId) {
//         try {
//             const [staff] = await pool.query(
//                 `SELECT id, name, department, designation, email, phone 
//                  FROM staff WHERE salon_id = ? AND status = 'active'`,
//                 [salonId]
//             );
            
//             const [rooms] = await pool.query(
//                 `SELECT id, name, room_type, capacity 
//                  FROM rooms WHERE salon_id = ? AND is_active = 1`,
//                 [salonId]
//             );
            
//             const [services] = await pool.query(
//                 `SELECT id, name, duration_minutes, base_price, category_id 
//                  FROM services WHERE salon_id = ? AND is_active = 1`,
//                 [salonId]
//             );
            
//             const [customers] = await pool.query(
//                 `SELECT id, name, phone, email 
//                  FROM customers WHERE salon_id = ? 
//                  ORDER BY created_at DESC LIMIT 100`,
//                 [salonId]
//             );
            
//             const [membershipPlans] = await pool.query(
//                 `SELECT id, name, price, tier, discount_percentage 
//                  FROM membership_plans WHERE salon_id = ? AND is_active = 1`,
//                 [salonId]
//             );
            
//             return {
//                 staff,
//                 rooms,
//                 services,
//                 customers,
//                 membership_plans: membershipPlans
//             };
//         } catch (error) {
//             console.error('Error getting resources:', error);
//             throw error;
//         }
//     }
    
//     // ==================== HELPER METHODS ====================
    
//     /**
//      * Get service duration
//      */
//     async getServiceDuration(serviceId) {
//         try {
//             if (!serviceId) return null;
//             const [rows] = await pool.query(`SELECT duration_minutes FROM services WHERE id = ?`, [serviceId]);
//             return rows[0]?.duration_minutes || null;
//         } catch (error) {
//             console.error('Error getting service duration:', error);
//             return null;
//         }
//     }
    
//     /**
//      * Get service price
//      */
//     async getServicePrice(serviceId) {
//         try {
//             if (!serviceId) return null;
//             const [rows] = await pool.query(`SELECT base_price FROM services WHERE id = ?`, [serviceId]);
//             return rows[0]?.base_price || null;
//         } catch (error) {
//             console.error('Error getting service price:', error);
//             return null;
//         }
//     }
    
//     /**
//      * Update booking
//      */
//     async updateBooking(bookingId, bookingData) {
//         try {
//             const fields = [];
//             const values = [];
            
//             for (const [key, value] of Object.entries(bookingData)) {
//                 if (value !== undefined && value !== null) {
//                     fields.push(`${key} = ?`);
//                     values.push(value);
//                 }
//             }
            
//             if (fields.length === 0) return false;
            
//             fields.push('updated_at = NOW()');
//             const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
//             values.push(bookingId);
            
//             const [result] = await pool.query(query, values);
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error updating booking:', error);
//             throw error;
//         }
//     }
// }

// module.exports = new CalendarModel();

const { pool } = require('../config/database');

class CalendarModel {

  async getEvents(salonId, filters) {
    const { start, end, staff_id, room_id, status } = filters;

    let sql = `
      SELECT
        b.id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status,
        b.notes,
        b.total_amount,
        c.id customer_id,
        c.name customer_name,
        s.id service_id,
        s.name service_name,
        st.id staff_id,
        st.name staff_name,
        r.id room_id,
        r.name room_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      LEFT JOIN services s ON bi.service_id = s.id
      LEFT JOIN staff st ON bi.staff_id = st.id
      LEFT JOIN rooms r ON bi.room_id = r.id
      WHERE b.salon_id = ?
    `;
    const params = [salonId];

    if (start && end) {
      sql += ` AND b.booking_date BETWEEN ? AND ?`;
      params.push(start, end);
    }
    if (staff_id) {
      sql += ` AND bi.staff_id = ?`;
      params.push(staff_id);
    }
    if (room_id) {
      sql += ` AND bi.room_id = ?`;
      params.push(room_id);
    }
    if (status) {
      sql += ` AND b.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY b.booking_date, b.start_time`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async createBooking(data, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Service details
      let servicePrice = 0;
      let serviceDuration = 60;
      
      if (data.service_id) {
        const [service] = await conn.query(
          'SELECT base_price, duration_minutes FROM services WHERE id = ?',
          [data.service_id]
        );
        if (service[0]) {
          servicePrice = service[0].base_price || 0;
          serviceDuration = service[0].duration_minutes || 60;
        }
      }

      // Calculate end time if not provided
      let endTime = data.end_time;
      if (!endTime && data.start_time) {
        const start = new Date(`2000-01-01T${data.start_time}`);
        start.setMinutes(start.getMinutes() + serviceDuration);
        endTime = start.toTimeString().slice(0, 8);
      }

      // Create booking
      const [booking] = await conn.query(
        `INSERT INTO bookings 
         (salon_id, customer_id, booking_type, booking_date, start_time, end_time, status, notes, total_amount, created_by, updated_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          data.salon_id,
          data.customer_id,
          'calling',
          data.booking_date,
          data.start_time,
          endTime || data.start_time,
          data.status || 'pending',
          data.notes || '',
          servicePrice,
          userId,
          userId
        ]
      );

      // Create booking item
      if (data.service_id) {
        await conn.query(
          `INSERT INTO booking_items
           (booking_id, service_id, staff_id, room_id, duration_minutes, price)
           VALUES (?,?,?,?,?,?)`,
          [
            booking.insertId,
            data.service_id,
            data.staff_id,
            data.room_id,
            serviceDuration,
            servicePrice
          ]
        );
      }

      await conn.commit();
      return booking.insertId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async updateBookingTime(id, booking_date, start_time, end_time, userId) {
    const [res] = await pool.query(
      `UPDATE bookings 
       SET booking_date=?, start_time=?, end_time=?, updated_by=?, updated_at=NOW()
       WHERE id=?`,
      [booking_date, start_time, end_time, userId, id]
    );
    return res.affectedRows > 0;
  }

  async cancelBooking(id) {
    const [res] = await pool.query(
      `UPDATE bookings SET status='cancelled' WHERE id=?`,
      [id]
    );
    return res.affectedRows > 0;
  }

  async checkConflict(date, start, end, staffId, roomId) {
    const query = `
      SELECT b.id, c.name as customer_name
      FROM bookings b
      JOIN booking_items bi ON bi.booking_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.booking_date = ?
        AND b.status NOT IN ('cancelled','completed')
        AND (
          (b.start_time < ? AND b.end_time > ?)
        )
        AND (? IS NULL OR bi.staff_id = ?)
        AND (? IS NULL OR bi.room_id = ?)
    `;
    
    const [rows] = await pool.query(query, [
      date, end, start,
      staffId, staffId,
      roomId, roomId
    ]);
    
    return rows.length > 0 ? rows : [];
  }
}

module.exports = new CalendarModel();