const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')

// POST thêm sản phẩm mới
router.post('/add', productController.createProduct)

module.exports = router
