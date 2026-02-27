const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getRevenueReport,
  getAppointmentsReport,
  getProfitReport,
  getServicePerformance
} = require('../controllers/reports.controller');

router.get('/revenue', authenticate, getRevenueReport);
router.get('/appointments', authenticate, getAppointmentsReport);
router.get('/profit', authenticate, getProfitReport);
router.get('/services', authenticate, getServicePerformance);

module.exports = router;