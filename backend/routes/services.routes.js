const express = require('express');
const router = express.Router();

/* MIDDLEWARE */
const { authenticate, authorize } = require('../middleware/auth.middleware');

/* CONTROLLERS */
const {
  /* CATEGORY */
  getMainCategories,
  getSubCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  deleteCategory,

  /* ROOM */
  getRooms,
  getSuitableRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,

  /* COMBO */
  getAllCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,

  /* OFFER */
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,

  /* SERVICES */
  getAllServices,
  getServicesByCategory,
  getServiceById,
  createService,
  updateService,
  deleteService

} = require('../controllers/services.controller');

/* ROLE PROTECTION */
const adminOnly = authorize('owner', 'center');

/* GLOBAL AUTH */
router.use(authenticate);

/* ================= CATEGORY ROUTES ================= */

router.get('/categories/main', getMainCategories);
router.get('/categories/sub', getSubCategories);
router.get('/categories/tree', getCategoriesTree);

router.post('/categories', adminOnly, createCategory);
router.put('/categories/:id(\\d+)', adminOnly, updateCategory);
router.delete('/categories/:id(\\d+)', adminOnly, deleteCategory);

/* ================= ROOM ROUTES ================= */

router.get('/rooms', getRooms);
router.get('/rooms/suitable/:serviceId(\\d+)', getSuitableRooms);
router.get('/rooms/:id(\\d+)', getRoomById);

router.post('/rooms', adminOnly, createRoom);
router.put('/rooms/:id(\\d+)', adminOnly, updateRoom);
router.delete('/rooms/:id(\\d+)', adminOnly, deleteRoom);

/* ================= COMBO ROUTES ================= */

router.get('/combos', getAllCombos);
router.get('/combos/:id(\\d+)', getComboById);

router.post('/combos', adminOnly, createCombo);
router.put('/combos/:id(\\d+)', adminOnly, updateCombo);
router.delete('/combos/:id(\\d+)', adminOnly, deleteCombo);

/* ================= OFFER ROUTES ================= */

router.get('/offers', getAllOffers);
router.get('/offers/:id(\\d+)', getOfferById);

router.post('/offers', adminOnly, createOffer);
router.put('/offers/:id(\\d+)', adminOnly, updateOffer);
router.delete('/offers/:id(\\d+)', adminOnly, deleteOffer);

/* ================= SERVICE ROUTES ================= */

router.get('/', getAllServices);
router.get('/category/:categoryId(\\d+)', getServicesByCategory);
router.get('/:id(\\d+)', getServiceById);

router.post('/', adminOnly, createService);
router.put('/:id(\\d+)', adminOnly, updateService);
router.delete('/:id(\\d+)', adminOnly, deleteService);

/* EXPORT ROUTER */
module.exports = router;