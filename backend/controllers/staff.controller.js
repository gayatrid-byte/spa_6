const Staff = require('../models/staff.model');

// ==================== STAFF MANAGEMENT ====================

async function getAllStaff(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const staff = await Staff.getAll(salonId, filters);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getStaffById(req, res) {
  try {
    const { id } = req.params;
    const staff = await Staff.getById(id);
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createStaff(req, res) {
  try {
    const staffData = {
      ...req.body,
      salon_id: req.user.salon_id,
      created_by: req.user.id
    };
    
    const staffId = await Staff.create(staffData);
    const staff = await Staff.getById(staffId);
    
    res.status(201).json({
      message: 'Staff created successfully',
      staff
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const updated = await Staff.update(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    const staff = await Staff.getById(id);
    
    res.json({
      message: 'Staff updated successfully',
      staff
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Staff.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getStaffDashboard(req, res) {
  try {
    const salonId = req.user.salon_id;
    const stats = await Staff.getDashboardStats(salonId);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== ATTENDANCE MANAGEMENT ====================

async function getAttendance(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const attendance = await Staff.getAttendance(salonId, filters);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createAttendanceRecord(req, res) {
  try {
    const salonId = req.user.salon_id;
    const attendanceData = req.body;
    
    // Verify staff belongs to this salon
    const staff = await Staff.getById(attendanceData.staff_id);
    if (!staff || staff.salon_id !== salonId) {
      return res.status(403).json({ error: 'Staff not found in your salon' });
    }
    
    // Check if record already exists
    const existing = await Staff.getAttendance(salonId, {
      staff_id: attendanceData.staff_id,
      date: attendanceData.attendance_date
    });
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Attendance record already exists for this date' });
    }
    
    // Create attendance record
    const attendanceId = await Staff.createAttendanceRecord(attendanceData);
    
    res.status(201).json({
      message: 'Attendance record created successfully',
      attendanceId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function clockIn(req, res) {
  try {
    const { staffId } = req.params;
    const clockInData = req.body;
    
    const attendanceId = await Staff.clockIn(staffId, clockInData);
    
    res.status(201).json({
      message: 'Clocked in successfully',
      attendanceId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function clockOut(req, res) {
  try {
    const { staffId } = req.params;
    const clockOutData = req.body;
    
    const updated = await Staff.clockOut(staffId, clockOutData);
    
    res.json({
      message: 'Clocked out successfully',
      updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const updated = await Staff.updateAttendance(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== LEAVE MANAGEMENT ====================

async function getLeaves(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const leaves = await Staff.getLeaves(salonId, filters);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getStaffOnLeave(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { date } = req.query;
    
    const leaves = await Staff.getStaffOnLeave(salonId, date);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function applyLeave(req, res) {
  try {
    const { staffId } = req.params;
    const leaveData = req.body;
    
    const leaveId = await Staff.applyLeave(staffId, leaveData);
    
    res.status(201).json({
      message: 'Leave application submitted successfully',
      leaveId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updated = await Staff.updateLeaveStatus(id, status, req.user.id);
    
    if (!updated) {
      return res.status(404).json({ error: 'Leave application not found' });
    }
    
    res.json({ message: 'Leave status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getLeaveBalance(req, res) {
  try {
    const { staffId } = req.params;
    const { year } = req.query;
    
    const balance = await Staff.getLeaveBalance(staffId, year);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== SCHEDULING ====================

async function getSchedule(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const schedule = await Staff.getSchedule(salonId, filters);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createSchedule(req, res) {
  try {
    const scheduleData = {
      ...req.body,
      published_by: req.user.id,
      published_at: new Date()
    };
    
    const scheduleId = await Staff.createSchedule(scheduleData);
    
    res.status(201).json({
      message: 'Schedule created successfully',
      scheduleId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const updated = await Staff.updateSchedule(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== REPORTS ====================

async function generateAttendanceReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, department } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const report = await Staff.generateAttendanceReport(salonId, startDate, endDate, department);
    
    res.json({
      startDate,
      endDate,
      department,
      report,
      totalStaff: report.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function exportAttendanceReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate, format, department } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const report = await Staff.generateAttendanceReport(salonId, startDate, endDate, department);
    
    if (format === 'excel') {
      // Generate Excel file
      const fileName = `attendance_report_${startDate}_to_${endDate}.xlsx`;
      const filePath = `/reports/${fileName}`;
      
      // In a real application, you would use a library like exceljs to generate the Excel file
      // For now, we'll return a mock response
      res.json({
        message: 'Excel report generated successfully',
        url: filePath,
        fileName: fileName
      });
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function generatePerformanceReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { periodType, startDate, endDate } = req.query;
    
    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Period type, start date, and end date are required' });
    }
    
    const report = await Staff.generatePerformanceReport(salonId, periodType, startDate, endDate);
    
    res.json({
      periodType,
      startDate,
      endDate,
      report,
      totalStaff: report.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function generatePayrollReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ error: 'Month is required (YYYY-MM)' });
    }
    
    const report = await Staff.generatePayrollReport(salonId, month);
    
    res.json({
      month,
      report,
      totalStaff: report.length,
      totalPayroll: report.reduce((sum, item) => sum + parseFloat(item.net_payable || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== STAFF SELF-SERVICE ====================

async function getMyProfile(req, res) {
  try {
    // Assuming staff users are in the same users table
    const staffId = req.user.id;
    const staff = await Staff.getById(staffId);
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getMyAttendance(req, res) {
  try {
    const staffId = req.user.id;
    const filters = req.query;
    
    // Get staff's salon_id
    const staff = await Staff.getById(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    const attendance = await Staff.getAttendance(staff.salon_id, { ...filters, staff_id: staffId });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getMyLeaves(req, res) {
  try {
    const staffId = req.user.id;
    const filters = req.query;
    
    // Get staff's salon_id
    const staff = await Staff.getById(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    const leaves = await Staff.getLeaves(staff.salon_id, { ...filters, staff_id: staffId });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  // Staff Management
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffDashboard,
  
  // Attendance
  getAttendance,
  createAttendanceRecord,
  clockIn,
  clockOut,
  updateAttendance,
  
  // Leaves
  getLeaves,
  getStaffOnLeave,
  applyLeave,
  updateLeaveStatus,
  getLeaveBalance,
  
  // Scheduling
  getSchedule,
  createSchedule,
  updateSchedule,
  
  // Reports
  generateAttendanceReport,
  exportAttendanceReport,
  generatePerformanceReport,
  generatePayrollReport,
  
  // Self-Service
  getMyProfile,
  getMyAttendance,
  getMyLeaves
};