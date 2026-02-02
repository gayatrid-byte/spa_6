const { verifyToken } = require('../config/auth');
const User = require('../models/user.model');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Simple role-based authorization middleware
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = req.user.role || req.user.user_role || 'staff';
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
}

module.exports = { authenticate, authorize };