const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
// Import all controller functions
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  getMainCategories,
  getSubCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  getSuitableRooms,
  getAllCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/services.controller');

// Basic service routes
router.get('/', servicesController.getAllServices);
router.get('/:id(\\d+)', servicesController.getServiceById);
router.post('/', authorize('owner', 'center'), servicesController.createService);
router.put('/:id(\\d+)', authorize('owner', 'center'), servicesController.updateService);
router.delete('/:id(\\d+)', authorize('owner', 'center'), servicesController.deleteService);
router.get('/category/:categoryId(\\d+)', servicesController.getServicesByCategory);

// Category management routes
router.get('/categories/main', servicesController.getMainCategories);
router.get('/categories/sub', servicesController.getSubCategories);
router.get('/categories/tree', servicesController.getCategoriesTree);
router.post('/categories', authorize('owner', 'center'), servicesController.createCategory);
router.put('/categories/:id', authorize('owner', 'center'), servicesController.updateCategory);
router.delete('/categories/:id', authorize('owner', 'center'), servicesController.deleteCategory);

// Room management routes
router.get('/rooms', servicesController.getRooms); // FIXED: Removed /all
router.get('/rooms/:id(\\d+)', servicesController.getRoomById);
router.post('/rooms', authorize('owner', 'center'), servicesController.createRoom);
router.put('/rooms/:id(\\d+)', authorize('owner', 'center'), servicesController.updateRoom);
router.delete('/rooms/:id(\\d+)', authorize('owner', 'center'), servicesController.deleteRoom);
router.get('/rooms/suitable/:serviceId', servicesController.getSuitableRooms);

// Combo/package routes
router.get('/combos/all', servicesController.getAllCombos);
router.get('/combos/:id', servicesController.getComboById);
router.post('/combos', authorize('owner', 'center'), servicesController.createCombo);
router.put('/combos/:id', authorize('owner', 'center'), servicesController.updateCombo);
router.delete('/combos/:id', authorize('owner', 'center'), servicesController.deleteCombo);

// Offer routes
router.get('/offers/all', servicesController.getAllOffers);
router.get('/offers/:id', servicesController.getOfferById);
router.post('/offers', authorize('owner', 'center'), servicesController.createOffer);
router.put('/offers/:id', authorize('owner', 'center'), servicesController.updateOffer);
router.delete('/offers/:id', authorize('owner', 'center'), servicesController.deleteOffer);

module.exports = router;