const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { user, products, totalPrice } = req.body;

    const order = new Order({ user, products, totalPrice });
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ user: userId }).populate('products.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng' });
  }
};
