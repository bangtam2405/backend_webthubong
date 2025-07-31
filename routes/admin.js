const express = require("express")
const router = express.Router()
const { auth, adminOnly } = require("../middleware/auth")
const adminController = require('../controllers/admin.controller')
const couponController = require('../controllers/coupon.controller');

router.get("/products", auth, adminOnly, (req, res) => {
  // Chỉ admin mới truy cập được
  res.json({ msg: "Danh sách sản phẩm cho admin" })
})

router.get('/stats', auth, adminOnly, adminController.getStats)

// Lấy mã giảm giá của user
router.get('/coupons/user/:userId', couponController.getCouponsByUser);

router.get("/top-products", auth, adminOnly, adminController.getTopProducts);

module.exports = router
