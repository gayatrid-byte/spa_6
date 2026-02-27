const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getAutoInvoiceItems
} = require('../controllers/billing.controller');

// Specific routes MUST come before param routes to avoid shadowing
router.get('/auto-items/by-day', authenticate, getAutoInvoiceItems);
router.get('/', authenticate, getAllInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.post('/', authenticate, createInvoice);
router.put('/:id', authenticate, updateInvoice);
router.patch('/:id/status', authenticate, updateInvoiceStatus);
router.delete('/:id', authenticate, deleteInvoice);

module.exports = router;