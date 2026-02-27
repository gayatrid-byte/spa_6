const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { login, logout, getProfile, updateProfile } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;