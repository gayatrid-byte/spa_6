const { pool } = require('../config/database');

class Staff {
  // ==================== STAFF MANAGEMENT ====================

  static async getAll(salonId, filters = {}) {
    try {
      let query = 'SELECT * FROM staff WHERE salon_id = ?';
      const params = [salonId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.department) {
        query += ' AND department = ?';
        params.push(filters.department);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR employee_id LIKE ? OR phone LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY name ASC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting staff: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM staff WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting staff by ID: ${error.message}`);
    }
  }

  static async create(staffData) {
    try {
      // Generate employee ID if not provided
      if (!staffData.employee_id) {
        const year = new Date().getFullYear().toString().slice(-2);
        const [lastStaff] = await pool.query(
          'SELECT employee_id FROM staff WHERE salon_id = ? ORDER BY id DESC LIMIT 1',
          [staffData.salon_id]
        );

        let nextNumber = 1;
        if (lastStaff.length > 0) {
          const lastId = lastStaff[0].employee_id;
          if (lastId && lastId.includes('-')) {
            const parts = lastId.split('-');
            nextNumber = parseInt(parts[1] || '0') + 1;
          }
        }

        staffData.employee_id = `STF-${year}${nextNumber.toString().padStart(3, '0')}`;
      }

      // Parse services_qualified if it's an array
      if (staffData.services_qualified && Array.isArray(staffData.services_qualified)) {
        staffData.services_qualified = JSON.stringify(staffData.services_qualified);
      }

      const [result] = await pool.query(
        `INSERT INTO staff SET ?`,
        [staffData]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating staff: ${error.message}`);
    }
  }

  static async update(id, staffData) {
    try {
      // Parse services_qualified if it's an array
      if (staffData.services_qualified && Array.isArray(staffData.services_qualified)) {
        staffData.services_qualified = JSON.stringify(staffData.services_qualified);
      }

      const [result] = await pool.query(
        'UPDATE staff SET ? WHERE id = ?',
        [staffData, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating staff: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM staff WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting staff: ${error.message}`);
    }
  }

  static async getDashboardStats(salonId) {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Total staff count
      const [totalStaff] = await pool.query(
        'SELECT COUNT(*) as count FROM staff WHERE salon_id = ? AND status = "active"',
        [salonId]
      );

      // Today's attendance - ONLY present, absent, late (no on_leave)
      const [todayAttendance] = await pool.query(
        `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN attendance_status = "present" THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN attendance_status = "absent" THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN attendance_status = "late" THEN 1 ELSE 0 END) as late
      FROM staff_attendance 
      WHERE attendance_date = ? AND staff_id IN (SELECT id FROM staff WHERE salon_id = ?)`,
        [today, salonId]
      );

      return {
        totalStaff: totalStaff[0]?.count || 0,
        todayAttendance: todayAttendance[0] || { total: 0, present: 0, absent: 0, late: 0 }
      };
    } catch (error) {
      throw new Error(`Error getting dashboard stats: ${error.message}`);
    }
  }

  // ==================== ATTENDANCE MANAGEMENT ====================

  static async getAttendance(salonId, filters = {}) {
    try {
      let query = `
        SELECT sa.*, s.name, s.employee_id, s.department, s.designation
        FROM staff_attendance sa
        JOIN staff s ON sa.staff_id = s.id
        WHERE s.salon_id = ?
      `;
      const params = [salonId];

      if (filters.date) {
        query += ' AND sa.attendance_date = ?';
        params.push(filters.date);
      }

      if (filters.staff_id) {
        query += ' AND sa.staff_id = ?';
        params.push(filters.staff_id);
      }

      if (filters.status) {
        query += ' AND sa.attendance_status = ?';
        params.push(filters.status);
      }

      if (filters.start_date && filters.end_date) {
        query += ' AND sa.attendance_date BETWEEN ? AND ?';
        params.push(filters.start_date, filters.end_date);
      }

      query += ' ORDER BY sa.attendance_date DESC, s.name ASC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting attendance: ${error.message}`);
    }
  }

  static async createAttendanceRecord(attendanceData) {
    try {
      // Check if record already exists
      const [existing] = await pool.query(
        'SELECT id FROM staff_attendance WHERE staff_id = ? AND attendance_date = ?',
        [attendanceData.staff_id, attendanceData.attendance_date]
      );

      if (existing.length > 0) {
        throw new Error('Attendance record already exists for this date');
      }

      const [result] = await pool.query(
        'INSERT INTO staff_attendance SET ?',
        [attendanceData]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating attendance record: ${error.message}`);
    }
  }

  static async clockIn(staffId, data) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Check if already clocked in today
      const [existing] = await pool.query(
        'SELECT * FROM staff_attendance WHERE staff_id = ? AND attendance_date = ?',
        [staffId, today]
      );

      if (existing.length > 0) {
        throw new Error('Already clocked in today');
      }

      const attendanceData = {
        staff_id: staffId,
        attendance_date: today,
        clock_in: data.clock_in_time || now,
        attendance_status: data.attendance_status || 'present',
        notes: data.notes
      };

      const [result] = await pool.query(
        'INSERT INTO staff_attendance SET ?',
        [attendanceData]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(`Error clocking in: ${error.message}`);
    }
  }

  static async clockOut(staffId, data) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      // Get today's attendance
      const [attendance] = await pool.query(
        'SELECT * FROM staff_attendance WHERE staff_id = ? AND attendance_date = ?',
        [staffId, today]
      );

      if (attendance.length === 0) {
        throw new Error('Not clocked in today');
      }

      if (attendance[0].clock_out) {
        throw new Error('Already clocked out today');
      }

      // Calculate total hours
      const clockIn = new Date(`${today}T${attendance[0].clock_in}`);
      const clockOut = new Date(`${today}T${now}`);
      const totalHours = ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2);

      const updateData = {
        clock_out: now,
        total_hours: totalHours,
        notes: data.notes || attendance[0].notes
      };

      const [result] = await pool.query(
        'UPDATE staff_attendance SET ? WHERE id = ?',
        [updateData, attendance[0].id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error clocking out: ${error.message}`);
    }
  }

  static async updateAttendance(id, data) {
    try {
      const [result] = await pool.query(
        'UPDATE staff_attendance SET ? WHERE id = ?',
        [data, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating attendance: ${error.message}`);
    }
  }

  // ==================== LEAVE MANAGEMENT ====================

  static async getLeaves(salonId, filters = {}) {
    try {
      let query = `
        SELECT sl.*, s.name, s.employee_id, s.department
        FROM staff_leaves sl
        JOIN staff s ON sl.staff_id = s.id
        WHERE s.salon_id = ?
      `;
      const params = [salonId];

      if (filters.status) {
        query += ' AND sl.status = ?';
        params.push(filters.status);
      }

      if (filters.staff_id) {
        query += ' AND sl.staff_id = ?';
        params.push(filters.staff_id);
      }

      if (filters.date) {
        query += ' AND ? BETWEEN sl.start_date AND sl.end_date';
        params.push(filters.date);
      }

      query += ' ORDER BY sl.start_date DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting leaves: ${error.message}`);
    }
  }

  static async getStaffOnLeave(salonId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      const query = `
        SELECT 
          s.name,
          s.employee_id,
          s.department,
          sl.leave_type,
          sl.start_date,
          sl.end_date,
          sl.status
        FROM staff_leaves sl
        JOIN staff s ON sl.staff_id = s.id
        WHERE s.salon_id = ?
          AND sl.status = 'approved'
          AND ? BETWEEN sl.start_date AND sl.end_date
        ORDER BY s.name ASC
      `;

      const [rows] = await pool.query(query, [salonId, date]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting staff on leave: ${error.message}`);
    }
  }

  static async applyLeave(staffId, leaveData) {
    try {
      // Calculate total days
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      leaveData.total_days = totalDays;
      leaveData.staff_id = staffId;

      const [result] = await pool.query(
        'INSERT INTO staff_leaves SET ?',
        [leaveData]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(`Error applying leave: ${error.message}`);
    }
  }

  static async updateLeaveStatus(id, status, approvedBy = null) {
    try {
      const updateData = {
        status: status,
        approved_by: approvedBy,
        approved_date: status === 'approved' ? new Date().toISOString().split('T')[0] : null
      };

      const [result] = await pool.query(
        'UPDATE staff_leaves SET ? WHERE id = ?',
        [updateData, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating leave status: ${error.message}`);
    }
  }

  static async getLeaveBalance(staffId, year = null) {
    try {
      if (!year) {
        year = new Date().getFullYear();
      }

      const [rows] = await pool.query(
        'SELECT * FROM staff_leave_balance WHERE staff_id = ? AND year = ?',
        [staffId, year]
      );

      if (rows.length === 0) {
        // Return default structure
        return {
          year: year,
          casual_leave_total: 12,
          casual_leave_taken: 0,
          casual_leave_remaining: 12,
          sick_leave_total: 7,
          sick_leave_taken: 0,
          sick_leave_remaining: 7,
          annual_leave_total: 21,
          annual_leave_taken: 0,
          annual_leave_remaining: 21,
          special_leave_total: 2,
          special_leave_taken: 0,
          special_leave_remaining: 2
        };
      }

      return rows[0];
    } catch (error) {
      throw new Error(`Error getting leave balance: ${error.message}`);
    }
  }

  // ==================== SCHEDULING ====================

  static async getSchedule(salonId, filters = {}) {
    try {
      let query = `
        SELECT ss.*, s.name, s.employee_id
        FROM staff_schedule ss
        JOIN staff s ON ss.staff_id = s.id
        WHERE s.salon_id = ?
      `;
      const params = [salonId];

      if (filters.week_start_date) {
        query += ' AND ss.week_start_date = ?';
        params.push(filters.week_start_date);
      }

      if (filters.status) {
        query += ' AND ss.status = ?';
        params.push(filters.status);
      } else {
        query += ' AND ss.status = "published"';
      }

      if (filters.staff_id) {
        query += ' AND ss.staff_id = ?';
        params.push(filters.staff_id);
      }

      query += ' ORDER BY ss.week_start_date DESC, s.name ASC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting schedule: ${error.message}`);
    }
  }

  static async createSchedule(scheduleData) {
    try {
      const [result] = await pool.query(
        'INSERT INTO staff_schedule SET ?',
        [scheduleData]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating schedule: ${error.message}`);
    }
  }

  static async updateSchedule(id, scheduleData) {
    try {
      const [result] = await pool.query(
        'UPDATE staff_schedule SET ? WHERE id = ?',
        [scheduleData, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating schedule: ${error.message}`);
    }
  }

  // ==================== REPORTS ====================

  static async generateAttendanceReport(salonId, startDate, endDate, department = null) {
    try {
      let query = `
        SELECT 
          s.name,
          s.employee_id,
          s.department,
          s.designation,
          COUNT(sa.id) as total_days,
          SUM(CASE WHEN sa.attendance_status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN sa.attendance_status IN ('leave', 'half_day') THEN 1 ELSE 0 END) as leave_days,
          SUM(CASE WHEN sa.attendance_status = 'late' THEN 1 ELSE 0 END) as late_days,
          ROUND(
            SUM(CASE WHEN sa.attendance_status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(sa.id), 0), 
            2
          ) as attendance_percentage
        FROM staff_attendance sa
        RIGHT JOIN staff s ON sa.staff_id = s.id 
          AND sa.attendance_date BETWEEN ? AND ?
        WHERE s.salon_id = ? 
          AND s.status = 'active'
      `;

      const params = [startDate, endDate, salonId];

      if (department) {
        query += ' AND s.department = ?';
        params.push(department);
      }

      query += `
        GROUP BY s.id, s.name, s.employee_id, s.department, s.designation
        ORDER BY s.department, s.name ASC
      `;

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error generating attendance report: ${error.message}`);
    }
  }

  static async generatePerformanceReport(salonId, periodType, startDate, endDate) {
    try {
      const [report] = await pool.query(
        `SELECT 
          s.name,
          s.employee_id,
          s.department,
          s.designation,
          sp.revenue_target,
          sp.revenue_achieved,
          sp.customers_served,
          sp.average_rating,
          sp.services_completed,
          sp.utilization_rate,
          sp.efficiency_score,
          ROUND((sp.revenue_achieved / sp.revenue_target) * 100, 2) as target_achievement_percentage
        FROM staff_performance sp
        JOIN staff s ON sp.staff_id = s.id
        WHERE s.salon_id = ?
          AND sp.period_type = ?
          AND sp.period_start >= ?
          AND sp.period_end <= ?
        ORDER BY sp.revenue_achieved DESC`,
        [salonId, periodType, startDate, endDate]
      );
      return report;
    } catch (error) {
      throw new Error(`Error generating performance report: ${error.message}`);
    }
  }

  static async generatePayrollReport(salonId, month) {
    try {
      const [report] = await pool.query(
        `SELECT 
          s.name,
          s.employee_id,
          s.department,
          sc.period_month,
          sc.base_salary,
          sc.service_commission_amount,
          sc.product_commission_amount,
          sc.performance_bonus_amount,
          sc.seniority_bonus,
          sc.overtime_pay,
          sc.total_earnings,
          sc.tax_deduction,
          sc.other_deductions,
          sc.net_payable,
          sc.payment_status
        FROM staff_commission sc
        JOIN staff s ON sc.staff_id = s.id
        WHERE s.salon_id = ?
          AND DATE_FORMAT(sc.period_month, '%Y-%m') = ?
        ORDER BY s.name ASC`,
        [salonId, month]
      );
      return report;
    } catch (error) {
      throw new Error(`Error generating payroll report: ${error.message}`);
    }
  }
}

module.exports = Staff;