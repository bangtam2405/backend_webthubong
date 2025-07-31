const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth'); // Giả định middleware xác thực của bạn

// Thêm đánh giá mới cho sản phẩm
router.post('/', auth, reviewController.addReview);

// Lấy tất cả đánh giá cho một sản phẩm (không cần auth)
router.get('/product/:productId', reviewController.getReviewsByProduct);

// Lấy tất cả đánh giá của người dùng hiện tại
router.get('/user', auth, reviewController.getReviewsByUser);

// Thêm route lấy tất cả review, có filter rating, limit
router.get('/', require('../controllers/review.controller').getAllReviews);

module.exports = router; 