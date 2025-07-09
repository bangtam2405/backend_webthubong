const express = require('express');
const router = express.Router();
const giftBoxController = require('../controllers/giftbox.controller');

// Lấy tất cả hộp quà
router.get('/', giftBoxController.getAllGiftBoxes);
// Lấy hộp quà theo id
router.get('/:id', giftBoxController.getGiftBoxById);
// Thêm hộp quà mới
router.post('/', giftBoxController.createGiftBox);
// Sửa hộp quà
router.put('/:id', giftBoxController.updateGiftBox);
// Xóa hộp quà
router.delete('/:id', giftBoxController.deleteGiftBox);

module.exports = router; 