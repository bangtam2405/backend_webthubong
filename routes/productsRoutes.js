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
// Thêm sản phẩm tùy chỉnh (user đã đăng nhập)
router.post('/custom', auth, productController.create);
// Sửa sản phẩm (chỉ admin)
router.put('/:id', auth, adminOnly, productController.update);
// Xóa sản phẩm (chỉ admin)
router.delete('/:id', auth, adminOnly, productController.remove);

// Cập nhật đánh giá và số lượng đã bán
router.post('/:id/rating', productController.updateRating);
router.post('/:id/sold', productController.updateSold);

// Lấy sản phẩm bán chạy nhất
router.get('/best-seller', productController.getBestSeller);
// Lấy sản phẩm được đánh giá cao nhất
router.get('/top-rated', productController.getTopRated);

module.exports = router;