// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/calendar.controller');
// const auth = require('../middleware/auth.middleware');

// router.get('/events', auth.authenticate, controller.getEvents);
// router.put('/events/:id', auth.authenticate, controller.updateEvent);

// module.exports = router;
const express = require('express');
const router = express.Router();
const controller = require('../controllers/customers.controller');
const { authenticate } = require('../middleware/auth.middleware');

/* ==============================
   CUSTOMER ROUTES
================================ */
router.get('/events', authenticate, controller.getEvents);
router.put('/events/:id', authenticate, controller.updateEvent);

router.get('/', authenticate, controller.getAllCustomers);
router.get('/search', authenticate, controller.searchCustomers);
router.get('/:id', authenticate, controller.getCustomerById);
router.post('/', authenticate, controller.createCustomer);
router.put('/:id', authenticate, controller.updateCustomer);
router.delete('/:id', authenticate, controller.deleteCustomer);
router.get('/:id', authenticate, controller.getCustomerById);

module.exports = router;
