const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET đơn hàng theo userId
router.get('/:userId', async (req, res) => {
  try {
    const cleanUserId = req.params.userId.trim();
    const orders = await Order.find({ user: cleanUserId }).populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy đơn hàng', error: err });
  }
});

// POST tạo đơn hàng mới
router.post('/', async (req, res) => {
  try {
    const { user, products, totalPrice } = req.body;
    const newOrder = new Order({ user, products, totalPrice });
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    res.status(500).json({ message: 'Tạo đơn hàng thất bại', error });
  }
});

module.exports = router;
