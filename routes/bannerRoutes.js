const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { auth, adminOnly } = require('../middleware/auth');

// Lấy tất cả banner (public)
router.get('/', bannerController.getAllBanners);
// Lấy chi tiết banner (public)
router.get('/:id', bannerController.getBannerById);
// Tạo banner (admin)
router.post('/', auth, adminOnly, bannerController.createBanner);
// Cập nhật banner (admin)
router.put('/:id', auth, adminOnly, bannerController.updateBanner);
// Xóa banner (admin)
router.delete('/:id', auth, adminOnly, bannerController.deleteBanner);

module.exports = router; 