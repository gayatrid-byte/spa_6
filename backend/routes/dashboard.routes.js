const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.get('/stats', authenticate, dashboardController.getDashboardStats);
router.get('/revenue', authenticate, dashboardController.getRevenueData);
router.get('/bookings', authenticate, dashboardController.getBookingData);
router.get('/customers', authenticate, dashboardController.getCustomerData);
router.get('/staff', authenticate, dashboardController.getStaffData);
router.get('/memberships', authenticate, dashboardController.getMembershipData);
router.get('/profit', authenticate, dashboardController.getProfitData);
router.get('/services', authenticate, dashboardController.getServiceData);
router.get('/forecast', authenticate, dashboardController.getForecastData);
router.get('/filters', authenticate, dashboardController.getFilterOptions);

module.exports = router;