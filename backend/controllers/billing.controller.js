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
    // Optional query flag to also delete linked bookings referenced by invoice.booking_ids
    const deleteBookings = req.query.delete_bookings === '1' || req.query.delete_bookings === 'true';

    // Load invoice first to get booking_ids
    const invoice = await Invoice.getById(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Perform deletion within a transaction to remove invoice, items and optionally bookings
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete invoice items
      await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

      // Delete invoice
      const [result] = await connection.query('DELETE FROM invoices WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Invoice not found when deleting' });
      }

      if (deleteBookings && Array.isArray(invoice.booking_ids) && invoice.booking_ids.length > 0) {
        // Delete booking_items and bookings for the IDs listed
        const ids = invoice.booking_ids.map(id => Number(id)).filter(n => !isNaN(n));
        if (ids.length > 0) {
          await connection.query(`DELETE FROM booking_items WHERE booking_id IN (${ids.join(',')})`);
          await connection.query(`DELETE FROM bookings WHERE id IN (${ids.join(',')})`);
        }
      }

      await connection.commit();
      res.json({ message: 'Invoice deleted successfully', bookings_deleted: deleteBookings });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
    const { customer_id, date, booking_ids } = req.query;

    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }

    let query = `
      SELECT bi.service_id, bi.booking_id, s.name as service_name, bi.price, s.base_price, b.subtotal_amount, b.discount_amount, b.tax_amount, b.wallet_applied, b.total_amount
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      JOIN services s ON bi.service_id = s.id
      WHERE b.salon_id = ? AND b.customer_id = ?
      AND b.status NOT IN ('cancelled')
    `;

    const params = [salonId, customer_id];

    if (booking_ids) {
      const ids = booking_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        query += ` AND bi.booking_id IN (${ids.join(',')})`;
      } else {
        // Provided booking_ids but distinct valid IDs are empty? Return empty
        return res.json({ items: [], subtotal: 0, auto_discount: 0, tax: 0, total: 0 });
      }
    } else if (date) {
      query += ` AND b.booking_date = ?`;
      params.push(date);
    } else {
      // If neither date nor booking_ids provided, maybe invalid request or define default behavior
      // For now, require one
      return res.status(400).json({ error: 'Either date or booking_ids is required' });
    }

    // Fetch booking items
    const [rows] = await pool.query(query, params);

    const items = rows.map(r => ({
      service_id: r.service_id,
      booking_id: r.booking_id, // Add booking_id to the items
      description: r.service_name,
      quantity: 1,
      price: parseFloat(r.price) || 0,
      base_price: parseFloat(r.base_price) || 0,
      total: parseFloat(r.price) || 0
    }));

    // For multi-booking invoices, we need totals per booking to accurate calculate sums
    // We can group rows by booking_id to extract booking-level totals
    const bookingTotalsMap = new Map();
    rows.forEach(r => {
      if (!bookingTotalsMap.has(r.booking_id)) {
        bookingTotalsMap.set(r.booking_id, {
          booking_id: r.booking_id,
          subtotal_amount: r.subtotal_amount,
          discount_amount: r.discount_amount,
          tax_amount: r.tax_amount,
          wallet_applied: r.wallet_applied,
          total_amount: r.total_amount
        });
      }
    });

    const booking_totals = Array.from(bookingTotalsMap.values());

    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

    // Membership discount calculation (percentage + wallet) without persisting wallet changes
    let planDiscount = 0;
    let walletApplied = 0;

    try {
      const membership = await Membership.getUserMembership(customer_id);
      if (membership && (membership.status === 'active' || membership.status === 'pending')) {
        const percent = parseFloat(membership.discount_percentage || 0);
        planDiscount = percent > 0 ? (subtotal * (percent / 100)) : 0;
        const walletBalance = parseFloat(membership.wallet_balance || 0);
        const remainingAfterDiscounts = Math.max(0, subtotal - planDiscount);
        walletApplied = Math.min(walletBalance, remainingAfterDiscounts);
      }
    } catch (_) { }

    const settings = getSettings();
    const taxRate = parseFloat(settings.billing?.taxRate || 0);
    const autoDiscount = parseFloat((planDiscount + walletApplied).toFixed(2));
    const tax = parseFloat(((subtotal - autoDiscount) * (taxRate / 100)).toFixed(2));
    const total = Math.max(0, parseFloat((subtotal - autoDiscount + tax).toFixed(2)));

    res.json({
      items,
      booking_totals, // Include booking totals for frontend calculations
      subtotal,
      auto_discount: autoDiscount,
      tax,
      total,
      breakdown: {
        planDiscount,
        walletApplied,
        taxRate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}