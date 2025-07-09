const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Products');
const Category = require('../models/Category');

exports.createOrder = async (req, res) => {
  try {
    let { user, products, totalPrice, name, phone, address } = req.body;
    // Ép userId về ObjectId nếu là string
    if (user && typeof user === "string" && mongoose.Types.ObjectId.isValid(user)) {
      user = new mongoose.Types.ObjectId(user);
    }
    // Kiểm tra tồn kho từng sản phẩm
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Không tìm thấy sản phẩm với id ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm '${product.name}' không đủ hàng trong kho` });
      }
    }
    // Kiểm tra tồn kho category nhỏ nhất nếu có
    for (const item of products) {
      const product = await Product.findById(item.product);
      // Giả sử product có trường categoryId là id của category nhỏ nhất (nếu có)
      if (product.categoryId) {
        const category = await Category.findById(product.categoryId);
        if (category && category.quantity !== undefined) {
          if (category.quantity < item.quantity) {
            return res.status(400).json({ message: `Danh mục '${category.name}' không đủ hàng trong kho` });
          }
        }
      }
    }
    // Trừ kho sản phẩm và category nhỏ nhất
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
      // Trừ kho category nhỏ nhất nếu có
      const product = await Product.findById(item.product);
      if (product.categoryId) {
        await Category.findByIdAndUpdate(product.categoryId, { $inc: { quantity: -item.quantity } });
      }
    }
    const order = new Order({ user, products, totalPrice, name, phone, address });
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowedStatus = [
      'Chờ xác nhận',
      'Đã xác nhận',
      'Đang xử lý',
      'Đang giao hàng',
      'Đã giao hàng',
      'Đã hủy'
    ];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product').populate('user');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('products.product')
      .populate('user');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn hàng' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelReason, cancelNote } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'Chờ xác nhận') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn khi đang chờ xác nhận' });
    }
    order.status = 'Đã hủy';
    order.cancelReason = cancelReason || '';
    order.cancelNote = cancelNote || '';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi hủy đơn hàng' });
  }
};

exports.updateOrderInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { name, phone, address } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (!["Chờ xác nhận", "Đã xác nhận"].includes(order.status)) {
      return res.status(400).json({ message: 'Chỉ có thể chỉnh sửa khi đơn hàng chưa xử lý/giao hàng' });
    }
    if (name) order.name = name;
    if (phone) order.phone = phone;
    if (address) order.address = address;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông tin đơn hàng' });
  }
};
