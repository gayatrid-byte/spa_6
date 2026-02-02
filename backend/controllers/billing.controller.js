const Invoice = require('../models/invoice.model');

async function getAllInvoices(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const invoices = await Invoice.getAll(salonId, filters);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.getById(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createInvoice(req, res) {
  try {
    const invoiceData = {
      ...req.body,
      salon_id: req.user.salon_id
    };
    
    const invoiceId = await Invoice.create(invoiceData);
    const invoice = await Invoice.getById(invoiceId);
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const updated = await Invoice.update(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = await Invoice.getById(id);
    
    res.json({
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateInvoiceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updated = await Invoice.updateStatus(id, status);
    
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Invoice.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice
};