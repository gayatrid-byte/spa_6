const { pool } = require('../config/database');
const User = require('../models/user.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and user's salon ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const salonId = req.user.salon_id;
    cb(null, `salon-${salonId}-logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

async function uploadLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }
    
    const logoPath = `/uploads/logos/${req.file.filename}`;
    const logoUrl = `${req.protocol}://${req.get('host')}${logoPath}`;
    const salonId = req.user.salon_id;
    
    // Save logo URL to salon settings
    await pool.query('UPDATE salons SET logo_url = ? WHERE id = ?', [logoUrl, salonId]);
    
    res.json({
      message: 'Logo uploaded successfully',
      logoPath: logoPath,
      logoUrl: logoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSettings(req, res) {
  try {
    const salonId = req.user?.salon_id || 1;
    const [rows] = await pool.query('SELECT * FROM salons WHERE id = ?', [salonId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    const salon = rows[0];
    
    // Format settings for frontend
    const response = {
      salon: {
        name: salon.name,
        address: salon.address,
        phone: salon.phone,
        email: salon.email,
        gstin: salon.gstin,
        logoUrl: salon.logo_url,
        working_hours_start: salon.working_hours_start,
        working_hours_end: salon.working_hours_end
      },
      billing: {
        gst_enabled: !!salon.billing_gst_enabled,
        gst_type: salon.billing_gst_type || 'intra',
        gst_rate: parseFloat(salon.billing_gst_rate || salon.billing_tax_rate || 0),
        cgst_rate: parseFloat(salon.billing_cgst_rate || 0),
        sgst_rate: parseFloat(salon.billing_sgst_rate || 0),
        igst_rate: parseFloat(salon.billing_igst_rate || 0),
        currency: salon.billing_currency || 'INR',
        invoicePrefix: salon.billing_invoice_prefix || 'INV',
        nextInvoiceNumber: salon.billing_next_invoice_number || 1001
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateSettings(req, res) {
  try {
    const salonId = req.user?.salon_id || 1;
    const { salon, billing } = req.body;
    
    // Build update query
    const updateFields = [];
    const values = [];
    
    if (salon) {
      if (salon.name !== undefined) { updateFields.push('name = ?'); values.push(salon.name); }
      if (salon.address !== undefined) { updateFields.push('address = ?'); values.push(salon.address); }
      if (salon.phone !== undefined) { updateFields.push('phone = ?'); values.push(salon.phone); }
      if (salon.email !== undefined) { updateFields.push('email = ?'); values.push(salon.email); }
      if (salon.gstin !== undefined) { updateFields.push('gstin = ?'); values.push(salon.gstin); }
      if (salon.logoUrl !== undefined) { updateFields.push('logo_url = ?'); values.push(salon.logoUrl); }
      if (salon.working_hours_start !== undefined) { updateFields.push('working_hours_start = ?'); values.push(salon.working_hours_start); }
      if (salon.working_hours_end !== undefined) { updateFields.push('working_hours_end = ?'); values.push(salon.working_hours_end); }
    }
    
    if (billing) {
      if (billing.gst_enabled !== undefined) { updateFields.push('billing_gst_enabled = ?'); values.push(billing.gst_enabled ? 1 : 0); }
      if (billing.gst_type !== undefined) { updateFields.push('billing_gst_type = ?'); values.push(billing.gst_type); }
      if (billing.gst_rate !== undefined) { updateFields.push('billing_gst_rate = ?'); values.push(billing.gst_rate); }
      if (billing.cgst_rate !== undefined) { updateFields.push('billing_cgst_rate = ?'); values.push(billing.cgst_rate); }
      if (billing.sgst_rate !== undefined) { updateFields.push('billing_sgst_rate = ?'); values.push(billing.sgst_rate); }
      if (billing.igst_rate !== undefined) { updateFields.push('billing_igst_rate = ?'); values.push(billing.igst_rate); }
      if (billing.currency !== undefined) { updateFields.push('billing_currency = ?'); values.push(billing.currency); }
      if (billing.invoicePrefix !== undefined) { updateFields.push('billing_invoice_prefix = ?'); values.push(billing.invoicePrefix); }
      if (billing.nextInvoiceNumber !== undefined) { updateFields.push('billing_next_invoice_number = ?'); values.push(billing.nextInvoiceNumber); }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(salonId);
    
    const [result] = await pool.query(
      `UPDATE salons SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    res.json({
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const users = await User.getAll(salonId);
    
    // Remove password from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const bcrypt = require('bcryptjs');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password || 'default123', 10);
    
    const userData = {
      ...req.body,
      password: hashedPassword,
      salon_id: req.user.salon_id
    };
    
    const userId = await User.create(userData);
    const user = await User.findById(userId);
    
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    
    const updated = await User.update(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = await User.findById(id);
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    // Prevent deleting own account
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const deleted = await User.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function exportBackup(req, res) {
  try {
    const salonId = req.user.salon_id;
    
    const [usersRows] = await pool.query('SELECT * FROM users WHERE salon_id = ?', [salonId]);
    const users = usersRows.map(u => { const { password, ...rest } = u; return rest; });
    
    const [staff] = await pool.query('SELECT * FROM staff WHERE salon_id = ?', [salonId]);
    const [customers] = await pool.query('SELECT * FROM customers WHERE salon_id = ?', [salonId]);
    const [services] = await pool.query('SELECT * FROM services WHERE salon_id = ?', [salonId]);
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE salon_id = ?', [salonId]);
    const [invoices] = await pool.query('SELECT * FROM billing WHERE salon_id = ?', [salonId]);
    const [expenses] = await pool.query('SELECT * FROM expenses WHERE salon_id = ?', [salonId]);
    
    res.json({
      users,
      staff,
      customers,
      services,
      bookings,
      invoices,
      expenses
    });
  } catch (error) {
    console.error('Backup generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  exportBackup,
  uploadLogo,
  upload // Export multer middleware for use in routes
};