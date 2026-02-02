const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice
} = require('../controllers/billing.controller');

router.get('/', authenticate, getAllInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.post('/', authenticate, createInvoice);
router.put('/:id', authenticate, updateInvoice);
router.patch('/:id/status', authenticate, updateInvoiceStatus);
router.delete('/:id', authenticate, deleteInvoice);

module.exports = router;