const { pool } = require('../config/database');

class Booking {
  // Get all bookings with filters
  static async getAll(salonId, filters = {}) {
    try {
      let query = `
        SELECT b.*, 
               c.name as customer_name, 
               c.phone as customer_phone,
               c.email as customer_email,
               COUNT(bi.id) as total_services,
               SUM(bi.duration_minutes) as total_duration_minutes
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN booking_items bi ON b.id = bi.booking_id
        WHERE b.salon_id = ?
      `;
      const params = [salonId];

      if (filters.booking_type) {
        query += ' AND b.booking_type = ?';
        params.push(filters.booking_type);
      }

      if (filters.status) {
        query += ' AND b.status = ?';
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        query += ' AND b.booking_date >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND b.booking_date <= ?';
        params.push(filters.dateTo);
      }

      if (filters.customer_name) {
        query += ' AND c.name LIKE ?';
        params.push(`%${filters.customer_name}%`);
      }

      if (filters.customer_id) {
        query += ' AND b.customer_id = ?';
        params.push(filters.customer_id);
      }

      if (filters.customer_phone) {
        query += ' AND c.phone LIKE ?';
        params.push(`%${filters.customer_phone}%`);
      }

      query += ' GROUP BY b.id ORDER BY b.booking_date DESC, b.start_time DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting bookings: ${error.message}`);
    }
  }

  // Get booking by ID with details
  static async getById(id) {
    try {
      // Get booking basic info
      const [bookingRows] = await pool.query(
        'SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE b.id = ?',
        [id]
      );

      if (bookingRows.length === 0) {
        return null;
      }

      const booking = bookingRows[0];

      // Get booking items with details
      const [itemRows] = await pool.query(
        `SELECT bi.*, 
                s.name as service_name,
                cat.name as category_name,
                subcat.name as subcategory_name,
                r.name as room_name,
                st.name as staff_name
         FROM booking_items bi
         JOIN services s ON bi.service_id = s.id
         JOIN categories cat ON bi.category_id = cat.id
         JOIN categories subcat ON bi.subcategory_id = subcat.id
         LEFT JOIN rooms r ON bi.room_id = r.id
         LEFT JOIN staff st ON bi.staff_id = st.id
         WHERE bi.booking_id = ?`,
        [id]
      );

      booking.items = itemRows;
      return booking;
    } catch (error) {
      throw new Error(`Error getting booking: ${error.message}`);
    }
  }

  // Create new booking
  static async create(bookingData, items) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert booking
      console.log('[Booking Model] Creating booking with data:', {
        subtotal_amount: bookingData.subtotal_amount,
        discount_amount: bookingData.discount_amount,
        tax_amount: bookingData.tax_amount,
        wallet_applied: bookingData.wallet_applied,
        total_amount: bookingData.total_amount
      });
      
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (
          salon_id, customer_id, booking_type, booking_date, start_time,
          end_time, total_duration, status, subtotal_amount,
          discount_amount, tax_amount, wallet_applied, total_amount, notes, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingData.salon_id,
          bookingData.customer_id || null,
          bookingData.booking_type || 'walk_in',
          bookingData.booking_date,
          bookingData.start_time,
          bookingData.end_time,
          bookingData.total_duration || 0,
          bookingData.status || 'pending',
          bookingData.subtotal_amount || 0,
          bookingData.discount_amount || 0,
          bookingData.tax_amount || 0,
          bookingData.wallet_applied || 0,
          bookingData.total_amount || 0,
          bookingData.notes || '',
          bookingData.created_by,
          bookingData.updated_by
        ]
      );

      const bookingId = bookingResult.insertId;

      // Insert booking items
      if (items && items.length > 0) {
        for (const item of items) {
          await connection.query(
            `INSERT INTO booking_items (
              booking_id, category_id, subcategory_id, service_id,
              room_id, staff_id, duration_minutes, price, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bookingId,
              item.category_id,
              item.subcategory_id,
              item.service_id,
              item.room_id,
              item.staff_id,
              item.duration_minutes,
              item.price,
              item.notes || ''
            ]
          );
        }
      }

      await connection.commit();
      return bookingId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating booking: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update booking
  static async update(id, bookingData, items = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update booking
      const [result] = await connection.query(
        `UPDATE bookings SET
          customer_id = ?,
          booking_type = ?,
          booking_date = ?,
          start_time = ?,
          end_time = ?,
          total_duration = ?,
          status = ?,
          subtotal_amount = ?,
          discount_amount = ?,
          tax_amount = ?,
          wallet_applied = ?,
          total_amount = ?,
          notes = ?,
          updated_by = ?
        WHERE id = ?`,
        [
          bookingData.customer_id || null,
          bookingData.booking_type,
          bookingData.booking_date,
          bookingData.start_time,
          bookingData.end_time,
          bookingData.total_duration || 0,
          bookingData.status,
          bookingData.subtotal_amount || 0,
          bookingData.discount_amount || 0,
          bookingData.tax_amount || 0,
          bookingData.wallet_applied || 0,
          bookingData.total_amount || 0,
          bookingData.notes || '',
          bookingData.updated_by,
          id
        ]
      );

      // Update items if provided
      if (items !== null) {
        // Delete existing items
        await connection.query('DELETE FROM booking_items WHERE booking_id = ?', [id]);

        // Insert new items
        if (items.length > 0) {
          for (const item of items) {
            await connection.query(
              `INSERT INTO booking_items (
                booking_id, category_id, subcategory_id, service_id,
                room_id, staff_id, duration_minutes, price, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                item.category_id,
                item.subcategory_id,
                item.service_id,
                item.room_id,
                item.staff_id,
                item.duration_minutes,
                item.price,
                item.notes || ''
              ]
            );
          }
        }
      }

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating booking: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update booking status
  static async updateStatus(id, status) {
    try {
      const [result] = await pool.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating booking status: ${error.message}`);
    }
  }

  // Delete booking
  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM bookings WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting booking: ${error.message}`);
    }
  }

  // Check availability
  static async checkAvailability(salonId, date, time, duration, excludeId = null) {
    try {
      const startTime = time;

      // Calculate end time
      const [timeResult] = await pool.query(
        'SELECT ADDTIME(?, SEC_TO_TIME(? * 60)) as end_time',
        [startTime, duration]
      );
      const endTime = timeResult[0].end_time;

      let query = `
        SELECT * FROM bookings
        WHERE salon_id = ? 
          AND booking_date = ? 
          AND status NOT IN ('cancelled', 'completed')
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND start_time < ?) OR
            (end_time > ? AND end_time <= ?)
          )
      `;

      const params = [salonId, date, endTime, startTime, startTime, endTime, startTime, endTime];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const [rows] = await pool.query(query, params);
      return rows.length === 0;
    } catch (error) {
      throw new Error(`Error checking availability: ${error.message}`);
    }
  }

  // Get available time slots for a date
  static async getAvailableSlots(salonId, date, duration = 60) {
    try {
      // Get business hours (you can make this configurable)
      const businessStart = '09:00:00';
      const businessEnd = '20:00:00';

      // Get existing bookings for the date
      const [bookings] = await pool.query(
        `SELECT start_time, end_time, total_duration 
         FROM bookings 
         WHERE salon_id = ? 
           AND booking_date = ? 
           AND status NOT IN ('cancelled')`,
        [salonId, date]
      );

      // Generate available slots
      const slots = [];
      let currentTime = businessStart;

      while (currentTime < businessEnd) {
        const slotEnd = await this.addMinutesToTime(currentTime, duration);

        if (slotEnd > businessEnd) {
          break;
        }

        // Check if slot overlaps with any existing booking
        // Check if slot overlaps with any existing booking
        const isAvailable = await Promise.all(
          bookings.map(async (booking) => {
            const bookingEnd = await this.addMinutesToTime(booking.start_time, booking.total_duration || 60);
            return !(currentTime < bookingEnd && slotEnd > booking.start_time);
          })
        ).then(results => results.every(result => result));

        if (isAvailable) {
          slots.push({
            start_time: currentTime,
            end_time: slotEnd,
            duration: duration
          });
        }

        // Move to next slot (15 minute increments)
        currentTime = await this.addMinutesToTime(currentTime, 15);
      }

      return slots;
    } catch (error) {
      throw new Error(`Error getting available slots: ${error.message}`);
    }
  }

  // Helper function to add minutes to time
  static async addMinutesToTime(time, minutes) {
    const [result] = await pool.query(
      'SELECT ADDTIME(?, SEC_TO_TIME(? * 60)) as new_time',
      [time, minutes]
    );
    return result[0].new_time;
  }

  // Search customers
  static async searchCustomers(salonId, searchTerm) {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, phone, email, address 
         FROM customers 
         WHERE salon_id = ? 
           AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
         LIMIT 10`,
        [salonId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error searching customers: ${error.message}`);
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(salonId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [stats] = await pool.query(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN booking_date = ? THEN 1 ELSE 0 END) as today_bookings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status IN ('pending', 'confirmed', 'in_progress') THEN 1 ELSE 0 END) as in_process_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          COUNT(*) as monthly_bookings,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_booking_value
         FROM bookings 
         WHERE salon_id = ? 
           AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [today, salonId]
      );

      return stats[0];
    } catch (error) {
      throw new Error(`Error getting dashboard stats: ${error.message}`);
    }
  }
}

module.exports = Booking;