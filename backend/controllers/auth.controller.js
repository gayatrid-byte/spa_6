const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/auth');
const User = require('../models/user.model');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        salon_id: user.salon_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function logout(req, res) {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      salon_id: user.salon_id,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    const updated = await User.update(userId, { name, phone });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findById(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        salon_id: user.salon_id,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { login, logout, getProfile, updateProfile };