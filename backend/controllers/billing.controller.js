const Invoice = require('../models/invoice.model');
const { pool } = require('../config/database');
const Membership = require('../models/membership.model');
const { getSettings } = require('../utils/settingsStore');

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
    console.log('=== CREATE INVOICE REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const invoiceData = {
      ...req.body,
      salon_id: req.user.salon_id
    };
    
    console.log('\nInvoice data to save:');
    console.log('  customer_id:', invoiceData.customer_id);
    console.log('  invoice_date:', invoiceData.invoice_date);
    console.log('  booking_ids:', invoiceData.booking_ids);
    console.log('  payment_methods:', invoiceData.payment_methods);
    console.log('  items count:', invoiceData.items?.length || 0);
    console.log('  items with booking_ids:');
    invoiceData.items?.forEach((item, i) => {
      console.log(`    [${i}] booking_ids: ${JSON.stringify(item.booking_ids)}, description: ${item.description}`);
    });
    
    const invoiceId = await Invoice.create(invoiceData);
    const invoice = await Invoice.getById(invoiceId);
    
    console.log('\nCreated invoice:');
    console.log('  id:', invoice.id);
    console.log('  invoice_number:', invoice.invoice_number);
    console.log('  booking_ids:', invoice.booking_ids);
    console.log('  payment_methods:', invoice.payment_methods);
    console.log('  items with booking_ids:');
    invoice.items?.forEach((item, i) => {
      console.log(`    [${i}] booking_ids: ${JSON.stringify(item.booking_ids)}, description: ${item.description}`);
    });
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
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
  deleteInvoice,
  getAutoInvoiceItems
};

// Auto-load services for a customer's selected day and compute discounts
async function getAutoInvoiceItems(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { customer_id, date } = req.query;
    const bookingIdsParam = req.query.booking_ids;
    const bookingIds = Array.isArray(bookingIdsParam)
      ? bookingIdsParam.map(id => parseInt(id, 10)).filter(Number.isFinite)
      : (bookingIdsParam ? bookingIdsParam.split(',').map(id => parseInt(id, 10)).filter(Number.isFinite) : []);

    if (!customer_id || (!date && bookingIds.length === 0)) {
      return res.status(400).json({ error: 'customer_id and date or booking_ids are required' });
    }

    const useBookingIds = bookingIds.length > 0;

    // Fetch booking items for specified bookings (or by date)
    const itemsQuery = useBookingIds
      ? `SELECT bi.booking_id, bi.service_id, s.name as service_name, bi.price
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         JOIN services s ON bi.service_id = s.id
         WHERE b.salon_id = ? AND bi.booking_id IN (${bookingIds.map(() => '?').join(',')})
           AND b.status NOT IN ('cancelled')`
      : `SELECT bi.booking_id, bi.service_id, s.name as service_name, bi.price
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         JOIN services s ON bi.service_id = s.id
         WHERE b.salon_id = ? AND b.customer_id = ? AND b.booking_date = ?
           AND b.status NOT IN ('cancelled')`;

    const itemsParams = useBookingIds
      ? [salonId, ...bookingIds]
      : [salonId, customer_id, date];

    const [rows] = await pool.query(itemsQuery, itemsParams);

    // Fetch booking totals (subtotal/discount/total) for the same set
    const totalsQuery = useBookingIds
      ? `SELECT id as booking_id, subtotal_amount, discount_amount, total_amount
         FROM bookings
         WHERE salon_id = ? AND id IN (${bookingIds.map(() => '?').join(',')})
           AND status NOT IN ('cancelled')`
      : `SELECT id as booking_id, subtotal_amount, discount_amount, total_amount
         FROM bookings
         WHERE salon_id = ? AND customer_id = ? AND booking_date = ?
           AND status NOT IN ('cancelled')`;

    const totalsParams = useBookingIds
      ? [salonId, ...bookingIds]
      : [salonId, customer_id, date];

    const [bookingTotals] = await pool.query(totalsQuery, totalsParams);

    const items = rows.map(r => ({
      booking_id: r.booking_id,
      service_id: r.service_id,
      description: r.service_name,
      quantity: 1,
      price: parseFloat(r.price) || 0,
      total: parseFloat(r.price) || 0
    }));

    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

    // Membership discount calculation (free services + percent + wallet) without persisting wallet/free changes
    let planDiscount = 0;
    let freeDeduction = 0;
    let walletApplied = 0;

    try {
      const membership = await Membership.getUserMembership(customer_id);
      if (membership && (membership.status === 'active' || membership.status === 'pending')) {
        const percent = parseFloat(membership.discount_percentage || 0);
        const pricesSorted = items
          .map(i => parseFloat(i.price) || 0)
          .filter(p => p > 0)
          .sort((a, b) => b - a);
        const freeRemaining = parseInt(membership.free_services_remaining || 0) || 0;
        const freeUsed = Math.min(freeRemaining, pricesSorted.length);
        if (freeUsed > 0) {
          freeDeduction = pricesSorted.slice(0, freeUsed).reduce((sum, p) => sum + p, 0);
        }
        const subtotalAfterFree = Math.max(0, subtotal - freeDeduction);
        planDiscount = percent > 0 ? (subtotalAfterFree * (percent / 100)) : 0;
        const walletBalance = parseFloat(membership.wallet_balance || 0);
        const remainingAfterDiscounts = Math.max(0, subtotalAfterFree - planDiscount);
        walletApplied = Math.min(walletBalance, remainingAfterDiscounts);
      }
    } catch (_) {}

    const settings = getSettings();
    const taxRate = parseFloat(settings.billing?.taxRate || 0);
    const autoDiscount = parseFloat((planDiscount + freeDeduction + walletApplied).toFixed(2));
    const tax = parseFloat(((subtotal - autoDiscount) * (taxRate / 100)).toFixed(2));
    const total = Math.max(0, parseFloat((subtotal - autoDiscount + tax).toFixed(2)));

    const bookingSubtotalSum = bookingTotals.reduce((s, b) => s + (parseFloat(b.subtotal_amount) || 0), 0);
    const bookingDiscountSum = bookingTotals.reduce((s, b) => s + (parseFloat(b.discount_amount) || 0), 0);
    const bookingTotalSum = bookingTotals.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0);

    res.json({
      items,
      booking_totals: bookingTotals,
      subtotal,
      auto_discount: autoDiscount,
      tax,
      total,
      breakdown: {
        freeDeduction,
        planDiscount,
        walletApplied,
        taxRate,
        bookingSubtotalSum,
        bookingDiscountSum,
        bookingTotalSum
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}