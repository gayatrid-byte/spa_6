const express = require('express');
const router = express.Router();

/* MIDDLEWARE */
const { authenticate, authorize } = require('../middleware/auth.middleware');

/* CONTROLLERS */
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} = require('../controllers/customers.controller');

/* ROLE PROTECTION */
const staffAccess = authorize('owner', 'center', 'staff');

/* GLOBAL AUTHENTICATION */
router.use(authenticate);

/* ================= CUSTOMER ROUTES ================= */

/* GET */
router.get('/', staffAccess, getAllCustomers);
router.get('/search', staffAccess, searchCustomers);
router.get('/:id', staffAccess, getCustomerById);

/* CREATE */
router.post('/', staffAccess, createCustomer);

/* UPDATE */
router.put('/:id', staffAccess, updateCustomer);

/* DELETE */
router.delete('/:id', authorize('owner', 'center'), deleteCustomer);

/* EXPORT ROUTER */
module.exports = router;