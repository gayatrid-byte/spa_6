const express = require('express');
const router = express.Router();
const controller = require('../controllers/calendar.controller');
const { authenticate } = require('../middleware/auth.middleware');

/* ==============================
   CALENDAR ROUTES
================================ */
router.get('/events', authenticate, controller.getEvents);
router.put('/events/:id', authenticate, controller.updateEvent);

module.exports = router;
