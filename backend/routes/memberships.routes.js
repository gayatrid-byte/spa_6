const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const membershipsController = require('../controllers/memberships.controller');

// All membership routes require authentication
router.use(authenticate);

// Plans
router.get('/plans', membershipsController.getPlans);
router.post('/plans', authorize('owner', 'center'), membershipsController.createPlan);
router.put('/plans/:id', authorize('owner', 'center'), membershipsController.updatePlan);
router.delete('/plans/:id', authorize('owner', 'center'), membershipsController.deletePlan);

// Current user's membership
router.get('/me', membershipsController.getMyMembership);

// Membership by customer ID
router.get('/customer/:id', membershipsController.getCustomerMembership);

// Assign membership (owner/center)
router.post('/assign', authorize('owner', 'center'), membershipsController.assignMembership);

// Update and delete membership (owner/center)
router.put('/:id', authorize('owner', 'center'), membershipsController.updateMembership);
router.delete('/:id', authorize('owner', 'center'), membershipsController.deleteMembership);

// Payments / Invoices (owner/center)
router.get('/payments', authorize('owner', 'center'), membershipsController.getPayments);
router.get('/payments/:id', authorize('owner', 'center'), membershipsController.getPaymentById);
router.post('/create-with-payment', authorize('owner', 'center'), membershipsController.createMembershipWithPayment);

module.exports = router;