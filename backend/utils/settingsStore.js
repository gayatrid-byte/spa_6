const { pool } = require('../config/database');

// In-memory cache for settings (updated from salon table)
let cachedSettings = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getSettings() {
  // Check if cache is still valid
  if (cachedSettings && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedSettings;
  }
  
  try {
    const [rows] = await pool.query('SELECT * FROM salons WHERE id = 1');
    
    if (rows.length === 0) {
      throw new Error('Default salon not found');
    }
    
    const salon = rows[0];
    
    // Convert database format to expected format
    cachedSettings = {
      salon: {
        name: salon.name || 'Salon Management System',
        address: salon.address || '',
        phone: salon.phone || '',
        email: salon.email || '',
        gstin: salon.gstin || '',
        logo: salon.logo_url || ''
      },
      billing: {
        gst_enabled: !!salon.billing_gst_enabled,
        gst_type: salon.billing_gst_type || 'intra',
        gst_rate: parseFloat(salon.billing_gst_rate || salon.billing_tax_rate || 18),
        cgst_rate: parseFloat(salon.billing_cgst_rate || 0),
        sgst_rate: parseFloat(salon.billing_sgst_rate || 0),
        igst_rate: parseFloat(salon.billing_igst_rate || 0),
        currency: salon.billing_currency || 'INR',
        invoicePrefix: salon.billing_invoice_prefix || 'INV',
        nextInvoiceNumber: salon.billing_next_invoice_number || 1001
      }
    };
    
    cacheTimestamp = Date.now();
    return cachedSettings;
  } catch (error) {
    console.error('Error loading settings from salon table:', error);
    
    // Return default settings if database fails
    return {
      salon: {
        name: 'Salon Management System',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        logo: '',
        workingHours: {
          start: '09:00:00',
          end: '21:00:00'
        }
      },
      billing: {
        taxRate: 18,
        currency: 'INR',
        invoicePrefix: 'INV',
        nextInvoiceNumber: 1001,
        currencySymbol: '₹'
      }
    };
  }
}

async function updateSettings(partial) {
  try {
    const updateFields = [];
    const values = [];
    
    if (partial.salon) {
      if (partial.salon.name !== undefined) { updateFields.push('name = ?'); values.push(partial.salon.name); }
      if (partial.salon.address !== undefined) { updateFields.push('address = ?'); values.push(partial.salon.address); }
      if (partial.salon.phone !== undefined) { updateFields.push('phone = ?'); values.push(partial.salon.phone); }
      if (partial.salon.email !== undefined) { updateFields.push('email = ?'); values.push(partial.salon.email); }
      if (partial.salon.gstin !== undefined) { updateFields.push('gstin = ?'); values.push(partial.salon.gstin); }
      if (partial.salon.logo !== undefined) { updateFields.push('logo_url = ?'); values.push(partial.salon.logo); }
    }
    
    if (partial.billing) {
      if (partial.billing.gst_enabled !== undefined) { updateFields.push('billing_gst_enabled = ?'); values.push(partial.billing.gst_enabled ? 1 : 0); }
      if (partial.billing.gst_type !== undefined) { updateFields.push('billing_gst_type = ?'); values.push(partial.billing.gst_type); }
      if (partial.billing.gst_rate !== undefined) { updateFields.push('billing_gst_rate = ?'); values.push(partial.billing.gst_rate); }
      if (partial.billing.cgst_rate !== undefined) { updateFields.push('billing_cgst_rate = ?'); values.push(partial.billing.cgst_rate); }
      if (partial.billing.sgst_rate !== undefined) { updateFields.push('billing_sgst_rate = ?'); values.push(partial.billing.sgst_rate); }
      if (partial.billing.igst_rate !== undefined) { updateFields.push('billing_igst_rate = ?'); values.push(partial.billing.igst_rate); }
      if (partial.billing.currency !== undefined) { updateFields.push('billing_currency = ?'); values.push(partial.billing.currency); }
      if (partial.billing.invoicePrefix !== undefined) { updateFields.push('billing_invoice_prefix = ?'); values.push(partial.billing.invoicePrefix); }
      if (partial.billing.nextInvoiceNumber !== undefined) { updateFields.push('billing_next_invoice_number = ?'); values.push(partial.billing.nextInvoiceNumber); }
    }
    
    if (updateFields.length === 0) {
      return await getSettings();
    }
    
    await pool.query(
      `UPDATE salons SET ${updateFields.join(', ')} WHERE id = 1`,
      values
    );
    
    // Invalidate cache
    cachedSettings = null;
    cacheTimestamp = null;
    
    return await getSettings();
  } catch (error) {
    console.error('Error updating settings in salon table:', error);
    throw error;
  }
}

async function generateInvoiceNumber() {
  try {
    // Get current invoice number and increment it atomically
    const [result] = await pool.query(
      'UPDATE salons SET billing_next_invoice_number = billing_next_invoice_number + 1 WHERE id = 1'
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Failed to increment invoice number');
    }
    
    // Get the updated number directly from database (not cached)
    const [rows] = await pool.query(
      'SELECT billing_invoice_prefix, billing_next_invoice_number FROM salons WHERE id = 1'
    );
    
    if (rows.length === 0) {
      throw new Error('Failed to get updated invoice number');
    }
    
    const prefix = rows[0].billing_invoice_prefix || 'INV';
    const number = rows[0].billing_next_invoice_number;
    
    // Invalidate cache since we just updated the settings
    cachedSettings = null;
    cacheTimestamp = null;
    
    return `${prefix}-${number}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number if database fails
    return `INV-${Date.now()}`;
  }
}

module.exports = {
  getSettings,
  updateSettings,
  generateInvoiceNumber
};
