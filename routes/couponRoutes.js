const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');

// Lấy tất cả mã giảm giá (cho admin)
router.get('/', couponController.getAllCoupons);

// Sửa mã giảm giá
router.put('/:id', couponController.updateCoupon);

// Xóa mã giảm giá
router.delete('/:id', couponController.deleteCoupon);

// Áp dụng mã giảm giá
router.post('/apply', couponController.applyCoupon);

module.exports = router; 