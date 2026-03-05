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
router.put('/categories/:id', adminOnly, updateCategory);
router.delete('/categories/:id', adminOnly, deleteCategory);

/* ================= ROOM ROUTES ================= */

router.get('/rooms', getRooms);
router.get('/rooms/suitable/:serviceId', getSuitableRooms);
router.get('/rooms/:id', getRoomById);

router.post('/rooms', adminOnly, createRoom);
router.put('/rooms/:id', adminOnly, updateRoom);
router.delete('/rooms/:id', adminOnly, deleteRoom);

/* ================= COMBO ROUTES ================= */

router.get('/combos', getAllCombos);
router.get('/combos/:id', getComboById);

router.post('/combos', adminOnly, createCombo);
router.put('/combos/:id', adminOnly, updateCombo);
router.delete('/combos/:id', adminOnly, deleteCombo);

/* ================= OFFER ROUTES ================= */

router.get('/offers', getAllOffers);
router.get('/offers/:id', getOfferById);

router.post('/offers', adminOnly, createOffer);
router.put('/offers/:id', adminOnly, updateOffer);
router.delete('/offers/:id', adminOnly, deleteOffer);

/* ================= SERVICE ROUTES ================= */

router.get('/', getAllServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/:id', getServiceById);

router.post('/', adminOnly, createService);
router.put('/:id', adminOnly, updateService);
router.delete('/:id', adminOnly, deleteService);

/* EXPORT ROUTER */
module.exports = router;