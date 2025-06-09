const express = require('express');
const router = express.Router();
const Accessory = require('../models/Accessory');

// Lấy danh sách phụ kiện
router.get('/', async (req, res) => {
  try {
    const accessories = await Accessory.find();
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thêm phụ kiện (dành cho admin)
router.post('/', async (req, res) => {
  const { name, type, imageUrl, price } = req.body;
  try {
    const newAccessory = new Accessory({ name, type, imageUrl, price });
    await newAccessory.save();
    res.status(201).json(newAccessory);
  } catch (error) {
    res.status(400).json({ message: 'Thêm phụ kiện thất bại' });
  }
});

module.exports = router;
