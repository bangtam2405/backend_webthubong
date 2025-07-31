const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Products');
const Design = require('../models/Design');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const { sendMail } = require('../mailer');
const User = require('../models/User');

exports.createOrder = async (req, res) => {
  try {
    let { user, products, totalPrice, name, phone, address, paymentMethod, coupon, discountAmount } = req.body;
    // Ép userId về ObjectId nếu là string
    if (user && typeof user === "string" && mongoose.Types.ObjectId.isValid(user)) {
      user = new mongoose.Types.ObjectId(user);
    }
    // Kiểm tra tồn kho từng sản phẩm
    for (const item of products) {
      // Tìm trong cả Product và Design collections
      let product = await Product.findById(item.product);
      let isDesign = false;
      
      if (!product) {
        // Nếu không tìm thấy trong Product, thử tìm trong Design
        product = await Design.findById(item.product);
        isDesign = true;
      }
      
      if (!product) {
        return res.status(400).json({ message: `Không tìm thấy sản phẩm với id ${item.product}` });
      }
      
      // Chỉ kiểm tra stock cho sản phẩm thường, không phải design
      if (!isDesign && product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm '${product.name || product.designName}' không đủ hàng trong kho` });
      }
    }
    // Kiểm tra tồn kho category nhỏ nhất nếu có (chỉ cho sản phẩm thường)
    for (const item of products) {
      const product = await Product.findById(item.product);
      // Chỉ kiểm tra category cho sản phẩm thường, không phải design
      if (product && product.categoryId) {
        const category = await Category.findById(product.categoryId);
        if (category && category.quantity !== undefined) {
          if (category.quantity < item.quantity) {
            return res.status(400).json({ message: `Danh mục '${category.name}' không đủ hàng trong kho` });
          }
        }
      }
    }
    // Trừ kho sản phẩm và category nhỏ nhất (chỉ cho sản phẩm thường)
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (product) {
        // Chỉ trừ kho cho sản phẩm thường
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
        // Trừ kho category nhỏ nhất nếu có
        if (product.categoryId) {
          await Category.findByIdAndUpdate(product.categoryId, { $inc: { quantity: -item.quantity } });
        }
      }
      // Design không cần trừ kho vì được làm theo đơn hàng
    }
    const order = new Order({ user, products, totalPrice, name, phone, address, paymentMethod, coupon, discountAmount });
    await order.save();
    // Nếu đơn hàng đủ điều kiện, tặng mã giảm giá cho user
    if (user && totalPrice >= 300000) {
      const code = `THANKS${Math.floor(1000 + Math.random() * 9000)}`;
      const coupon = new Coupon({
        code,
        type: 'percentage',
        value: 10, // 10% giảm giá
        minOrderAmount: 0,
        usageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 14*24*60*60*1000), // Hạn dùng 14 ngày
        isActive: true,
        userId: user,
      });
      await coupon.save();
      // Gửi email nếu user có email
      try {
        const userObj = await require('../models/User').findById(user);
        if (userObj && userObj.email) {
          const html = `<h2>Cảm ơn bạn đã mua hàng tại Gấu Xinh!</h2>
            <p>Đơn hàng của bạn đã thành công. Dưới đây là mã giảm giá dành riêng cho bạn:</p>
            <div style="font-size:1.5em;font-weight:bold;color:#e3497a;margin:16px 0">${code}</div>
            <ul>
              <li>Giảm 10% cho đơn hàng tiếp theo</li>
              <li>Chỉ dùng 1 lần, hạn dùng 14 ngày</li>
            </ul>
            <p>Chúc bạn mua sắm vui vẻ tại Gấu Xinh!</p>`;
          await sendMail(userObj.email, "Cảm ơn bạn - Nhận mã giảm giá cho đơn tiếp theo", html);
        }
      } catch (e) { console.error('Lỗi gửi email coupon order:', e.message); }
    }
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    // Populate products manually để hỗ trợ cả Product và Design
    for (let order of orders) {
      for (let productItem of order.products) {
        // Thử populate từ Product trước
        let product = await Product.findById(productItem.product);
        if (!product) {
          // Nếu không tìm thấy, thử từ Design
          product = await Design.findById(productItem.product);
        }
        productItem.product = product;
      }
    }
    
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

    // --- Tự động nâng hạng user khi đơn hàng chuyển sang 'Đã giao hàng' ---
    if (status === 'Đã giao hàng' && order.user) {
      const user = await User.findById(order.user);
      if (user) {
        const orders = await Order.find({ user: user._id, status: 'Đã giao hàng' });
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        let newType = 'new';
        if (totalSpent >= 10000000 || totalOrders >= 20) {
          newType = 'vip';
        } else if (totalSpent >= 2000000 || totalOrders >= 5) {
          newType = 'regular';
        }
        if (user.type !== newType) {
          user.type = newType;
          await user.save();
        }
      }
    }
    // --- END tự động nâng hạng ---

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'username email');
    
    // Populate products manually để hỗ trợ cả Product và Design
    for (let order of orders) {
      for (let productItem of order.products) {
        // Thử populate từ Product trước
        let product = await Product.findById(productItem.product);
        if (!product) {
          // Nếu không tìm thấy, thử từ Design
          product = await Design.findById(productItem.product);
        }
        productItem.product = product;
      }
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    
    // Populate products manually để hỗ trợ cả Product và Design
    for (let productItem of order.products) {
      // Thử populate từ Product trước
      let product = await Product.findById(productItem.product);
      if (!product) {
        // Nếu không tìm thấy, thử từ Design
        product = await Design.findById(productItem.product);
      }
      productItem.product = product;
    }
    
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

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deleted = await Order.findByIdAndDelete(orderId);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa đơn hàng' });
  }
};
