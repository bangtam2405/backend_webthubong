const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { auth, adminOnly } = require('../middleware/auth'); // Giả định middleware xác thực của bạn

// Lấy danh sách yêu thích của người dùng hiện tại
router.get('/', auth, wishlistController.getWishlist);

// Lấy danh sách yêu thích của người dùng theo ID (cho admin)
router.get('/admin/:userId', auth, adminOnly, wishlistController.getWishlistByUserId);

// Thêm sản phẩm vào danh sách yêu thích
router.post('/', auth, wishlistController.addToWishlist);

// Xóa sản phẩm khỏi danh sách yêu thích
router.delete('/', auth, wishlistController.removeFromWishlist);

module.exports = router; 