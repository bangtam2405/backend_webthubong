const express = require('express');
const router = express.Router();
const productCategoryController = require('../controllers/productCategory.controller');
const verifyToken = require('../middleware/verifyToken');
const checkAdmin = require('../middleware/checkAdmin');

// Routes cho admin (cần đăng nhập và quyền admin)
router.get('/admin', verifyToken, checkAdmin, productCategoryController.getAllProductCategories);
router.get('/admin/:id', verifyToken, checkAdmin, productCategoryController.getProductCategoryById);
router.post('/admin', verifyToken, checkAdmin, productCategoryController.createProductCategory);
router.put('/admin/:id', verifyToken, checkAdmin, productCategoryController.updateProductCategory);
router.delete('/admin/:id', verifyToken, checkAdmin, productCategoryController.deleteProductCategory);
router.put('/admin/order', verifyToken, checkAdmin, productCategoryController.updateCategoryOrder);

// Routes cho frontend (public)
router.get('/', productCategoryController.getActiveProductCategories);
router.get('/:id', productCategoryController.getProductCategoryById);

module.exports = router;