const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');

// GET /api/products - lấy danh sách sản phẩm
router.get('/', productController.getAllProducts);

// POST /api/products - thêm sản phẩm mới
router.post('/', productController.createProduct);

module.exports = router;
