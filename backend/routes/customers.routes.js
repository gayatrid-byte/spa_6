const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller'); // CORRECT
const { authenticate } = require('../middleware/auth.middleware');

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} = require('../controllers/customers.controller');

router.get('/', authenticate, getAllCustomers);
router.get('/search', authenticate, searchCustomers);
router.get('/:id', authenticate, getCustomerById);
router.post('/', authenticate, createCustomer);
router.put('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, deleteCustomer);

router.get('/', authenticate, customersController.getAllCustomers);
router.get('/search', authenticate, customersController.searchCustomers);
router.get('/:id', authenticate, customersController.getCustomerById);
router.post('/', authenticate, customersController.createCustomer);
router.put('/:id', authenticate, customersController.updateCustomer);
router.delete('/:id', authenticate, customersController.deleteCustomer);

module.exports = router;