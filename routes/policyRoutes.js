const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');
const { auth, adminOnly } = require('../middleware/auth');

// Shipping Zone Routes
router.get('/shipping', policyController.getAllShippingZones);
router.post('/shipping', auth, adminOnly, policyController.createShippingZone);
router.put('/shipping/:id', auth, adminOnly, policyController.updateShippingZone);
router.delete('/shipping/:id', auth, adminOnly, policyController.deleteShippingZone);

// Return Policy Routes
router.get('/returns', policyController.getAllReturnPolicies);
router.post('/returns', auth, adminOnly, policyController.createReturnPolicy);
router.put('/returns/:id', auth, adminOnly, policyController.updateReturnPolicy);
router.delete('/returns/:id', auth, adminOnly, policyController.deleteReturnPolicy);

// Warranty Policy Routes
router.get('/warranty', policyController.getAllWarrantyPolicies);
router.post('/warranty', auth, adminOnly, policyController.createWarrantyPolicy);
router.put('/warranty/:id', auth, adminOnly, policyController.updateWarrantyPolicy);
router.delete('/warranty/:id', auth, adminOnly, policyController.deleteWarrantyPolicy);

module.exports = router; 