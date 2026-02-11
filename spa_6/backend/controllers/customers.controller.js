const Customer = require('../models/customer.model');

async function getAllCustomers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query; // Get filters from query params
    
    const customers = await Customer.getAll(salonId, filters);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createCustomer(req, res) {
  try {
    const { phone, name, email, address, notes } = req.body;
    
    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Phone validation - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    
    const customerData = {
      salon_id: req.user.salon_id,
      phone: phone.trim(),
      name: name ? name.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null
    };
    
    const customerId = await Customer.create(customerData);
    const customer = await Customer.getById(customerId);
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { phone, name, email, address, notes } = req.body;
    
    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Phone validation - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    
    const customerData = {
      phone: phone.trim(),
      name: name ? name.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null
    };
    
    const updated = await Customer.update(id, customerData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = await Customer.getById(id);
    
    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Customer.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function searchCustomers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { q } = req.query;
    const filters = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const customers = await Customer.search(salonId, q, filters);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};