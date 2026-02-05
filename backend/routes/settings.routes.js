const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize: authorizeRole } = require('../middleware/role.middleware'); // Keep as authorizeRole
const {
  getSettings,
  updateSettings,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  uploadLogo,
  upload
} = require('../controllers/settings.controller');

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorizeRole('owner', 'center'), updateSettings);
router.post('/upload-logo', authenticate, authorizeRole('owner', 'center'), upload.single('logo'), uploadLogo);
router.get('/users', authenticate, getAllUsers);
router.post('/users', authenticate, authorizeRole('owner', 'center'), createUser);
router.put('/users/:id', authenticate, authorizeRole('owner', 'center'), updateUser);
router.delete('/users/:id', authenticate, authorizeRole('owner'), deleteUser);

module.exports = router;