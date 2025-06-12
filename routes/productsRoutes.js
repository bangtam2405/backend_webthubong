const express = require('express');
const router = express.Router();
const productController = require('../controllers/products.controller');
const { auth, adminOnly } = require('../middleware/auth');

// Lấy tất cả sản phẩm (có thể lọc theo type)
router.get('/', productController.getAll);
// Lấy sản phẩm theo id
router.get('/:id', productController.getById);
// Thêm sản phẩm mới (chỉ admin)
router.post('/', auth, adminOnly, productController.create);
// Sửa sản phẩm (chỉ admin)
router.put('/:id', auth, adminOnly, productController.update);
// Xóa sản phẩm (chỉ admin)
router.delete('/:id', auth, adminOnly, productController.remove);

module.exports = router;