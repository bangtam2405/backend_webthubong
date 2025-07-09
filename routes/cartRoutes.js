const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { auth } = require('../middleware/auth'); // Giả định middleware xác thực của bạn

// Lấy giỏ hàng của người dùng hiện tại
router.get('/', auth, cartController.getCart);

// Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng
router.post('/', auth, cartController.addToCart);

// Cập nhật số lượng của một sản phẩm cụ thể trong giỏ hàng
router.put('/', auth, cartController.updateCartItemQuantity);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/', auth, cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng (tùy chọn)
router.delete('/clear', auth, cartController.clearCart);

module.exports = router; 