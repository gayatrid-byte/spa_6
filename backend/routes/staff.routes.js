const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const {
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
} = require('../controllers/staff.controller');

// ==================== STAFF SELF-SERVICE ====================
// NOTE: Specific routes MUST come before /:id to avoid shadowing
router.get('/my/profile', authenticate, getMyProfile);
router.get('/my/attendance', authenticate, getMyAttendance);
router.get('/my/leaves', authenticate, getMyLeaves);

// ==================== REPORTS ====================
router.get('/reports/attendance/export', authenticate, exportAttendanceReport);
router.get('/reports/attendance', authenticate, generateAttendanceReport);
router.get('/reports/performance', authenticate, generatePerformanceReport);
router.get('/reports/payroll', authenticate, generatePayrollReport);

// ==================== ATTENDANCE ====================
router.get('/attendance/all', authenticate, getAttendance);
router.post('/attendance/record', authenticate, createAttendanceRecord);
router.post('/attendance/:staffId/clock-in', authenticate, clockIn);
router.post('/attendance/:staffId/clock-out', authenticate, clockOut);
router.put('/attendance/:id', authenticate, authorize('owner', 'center'), updateAttendance);

// ==================== LEAVES ====================
router.get('/leaves/all', authenticate, getLeaves);
router.get('/leaves/on-leave', authenticate, getStaffOnLeave);
router.post('/leaves/:staffId/apply', authenticate, applyLeave);
router.patch('/leaves/:id/status', authenticate, authorize('owner', 'center'), updateLeaveStatus);
router.get('/leaves/:staffId/balance', authenticate, getLeaveBalance);

// ==================== SCHEDULING ====================
router.get('/schedule/all', authenticate, getSchedule);
router.post('/schedule', authenticate, authorize('owner', 'center'), createSchedule);
router.put('/schedule/:id', authenticate, authorize('owner', 'center'), updateSchedule);

// ==================== STAFF MANAGEMENT ====================
// Generic /:id routes LAST so they don't shadow specific routes above
router.get('/dashboard', authenticate, getStaffDashboard);
router.get('/', authenticate, getAllStaff);
router.get('/:id', authenticate, getStaffById);
router.post('/', authenticate, authorize('owner', 'center'), createStaff);
router.put('/:id', authenticate, authorize('owner', 'center'), updateStaff);
router.delete('/:id', authenticate, authorize('owner', 'center'), deleteStaff);

module.exports = router;