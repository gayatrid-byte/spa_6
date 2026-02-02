const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getDashboardStats } = require('../controllers/dashboard.controller');

router.get('/stats', authenticate, getDashboardStats);

module.exports = router;