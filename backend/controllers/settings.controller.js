// const User = require('../models/user.model');

// async function getSettings(req, res) {
//   try {
//     // Return basic settings structure
//     res.json({
//       salon: {
//         name: 'My Salon',
//         address: '',
//         phone: '',
//         email: '',
//         workingHours: {
//           monday: { open: '09:00', close: '18:00', closed: false },
//           tuesday: { open: '09:00', close: '18:00', closed: false },
//           wednesday: { open: '09:00', close: '18:00', closed: false },
//           thursday: { open: '09:00', close: '18:00', closed: false },
//           friday: { open: '09:00', close: '18:00', closed: false },
//           saturday: { open: '09:00', close: '17:00', closed: false },
//           sunday: { open: '09:00', close: '17:00', closed: true }
//         }
//       },
//       billing: {
//         taxRate: 0,
//         currency: 'USD',
//         invoicePrefix: 'INV'
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function updateSettings(req, res) {
//   try {
//     // Settings would be stored in a settings table in production
//     res.json({
//       message: 'Settings updated successfully',
//       settings: req.body
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function getAllUsers(req, res) {
//   try {
//     const salonId = req.user.salon_id;
//     const users = await User.getAll(salonId);
    
//     // Remove password from response
//     const usersWithoutPassword = users.map(user => {
//       const { password, ...userWithoutPassword } = user;
//       return userWithoutPassword;
//     });
    
//     res.json(usersWithoutPassword);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function createUser(req, res) {
//   try {
//     const bcrypt = require('bcryptjs');
    
//     // Hash password
//     const hashedPassword = await bcrypt.hash(req.body.password || 'default123', 10);
    
//     const userData = {
//       ...req.body,
//       password: hashedPassword,
//       salon_id: req.user.salon_id
//     };
    
//     const userId = await User.create(userData);
//     const user = await User.findById(userId);
    
//     const { password, ...userWithoutPassword } = user;
    
//     res.status(201).json({
//       message: 'User created successfully',
//       user: userWithoutPassword
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function updateUser(req, res) {
//   try {
//     const { id } = req.params;
    
//     const updated = await User.update(id, req.body);
    
//     if (!updated) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     const user = await User.findById(id);
//     const { password, ...userWithoutPassword } = user;
    
//     res.json({
//       message: 'User updated successfully',
//       user: userWithoutPassword
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function deleteUser(req, res) {
//   try {
//     const { id } = req.params;
    
//     // Prevent deleting own account
//     if (id === req.user.id) {
//       return res.status(400).json({ error: 'Cannot delete your own account' });
//     }
    
//     const deleted = await User.delete(id);
    
//     if (!deleted) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// module.exports = {
//   getSettings,
//   updateSettings,
//   getAllUsers,
//   createUser,
//   updateUser,
//   deleteUser
// };

const User = require('../models/user.model');

// Add a variable to store settings (in production, this would be in a database)
let salonSettings = {
  salon: {
    name: 'My Salon',
    address: '',
    phone: '',
    email: '',
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      Saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  },
  billing: {
    taxRate: 0,
    currency: 'USD',
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1001
  }
};

async function getSettings(req, res) {
  try {
    // Return saved settings
    res.json(salonSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateSettings(req, res) {
  try {
    // Update settings
    if (req.body.salon) {
      salonSettings.salon = { ...salonSettings.salon, ...req.body.salon };
    }
    if (req.body.billing) {
      salonSettings.billing = { ...salonSettings.billing, ...req.body.billing };
    }
    
    // Validate currency
    const validCurrencies = ['USD', 'INR', 'EUR', 'GBP'];
    if (salonSettings.billing.currency && !validCurrencies.includes(salonSettings.billing.currency)) {
      salonSettings.billing.currency = 'USD';
    }
    
    res.json({
      message: 'Settings updated successfully',
      settings: salonSettings
    });
  } catch (error) {
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

module.exports = {
  getSettings,
  updateSettings,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};