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
    let { user, products, totalPrice, name, phone, address, paymentMethod, coupon, discountAmount, shippingFee } = req.body;
    // Ép userId về ObjectId nếu là string
    if (user && typeof user === "string" && mongoose.Types.ObjectId.isValid(user)) {
      user = new mongoose.Types.ObjectId(user);
    }
    // Kiểm tra tồn kho từng sản phẩm
    for (const item of products) {
      console.log('Checking stock for product:', item.product);
      
      // Kiểm tra xem _id có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        console.log('Invalid ObjectId, skipping stock check (likely custom design)');
        continue;
      }
      
      // Tìm trong cả Product và Design collections
      let product = await Product.findById(item.product);
      let isDesign = false;
      
      if (!product) {
        // Nếu không tìm thấy trong Product, thử tìm trong Design
        product = await Design.findById(item.product);
        isDesign = true;
      }
      
      // Nếu vẫn không tìm thấy, có thể là design tạm thời - bỏ qua kiểm tra stock
      if (!product) {
        console.log('Product not found in database, skipping stock check (likely custom design)');
        continue;
      }
      
      // Chỉ kiểm tra stock cho sản phẩm thường, không phải design
      if (!isDesign && product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm '${product.name || product.designName}' không đủ hàng trong kho` });
      }
    }
    // Kiểm tra tồn kho category nhỏ nhất nếu có (chỉ cho sản phẩm thường)
    for (const item of products) {
      // Chỉ kiểm tra nếu _id hợp lệ
      if (mongoose.Types.ObjectId.isValid(item.product)) {
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
    }
    // Trừ kho sản phẩm và category nhỏ nhất (chỉ cho sản phẩm thường)
    for (const item of products) {
      // Chỉ trừ kho nếu _id hợp lệ
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        const product = await Product.findById(item.product);
        if (product) {
          // Chỉ trừ kho cho sản phẩm thường
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
          // Trừ kho category nhỏ nhất nếu có
          if (product.categoryId) {
            await Category.findByIdAndUpdate(product.categoryId, { $inc: { quantity: -item.quantity } });
          }
        }
      }
      // Design không cần trừ kho vì được làm theo đơn hàng
    }
    // Thêm thông tin sản phẩm đầy đủ vào products
    const productsWithInfo = await Promise.all(products.map(async (item) => {
      // Kiểm tra xem _id có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
                 // Custom design - sử dụng ảnh mặc định
         const productInfo = {
           _id: item.product,
           name: item.name || 'Sản phẩm tùy chỉnh',
           designName: item.designName || null,
           description: item.description || '',
           price: item.price || 0,
           image: '/dethuong.jpg',
           previewImage: '/dethuong.jpg',
           type: 'custom'
         };
        return {
          ...item,
          productInfo
        };
      }
      
      let product = await Product.findById(item.product);
      let isDesign = false;
      
      if (!product) {
        product = await Design.findById(item.product);
        isDesign = true;
      }
      
             // Nếu vẫn không tìm thấy, có thể là design tạm thời từ giỏ hàng
       if (!product) {
         const productInfo = {
           _id: item.product,
           name: item.name || 'Sản phẩm tùy chỉnh',
           designName: item.designName || null,
           description: item.description || '',
           price: item.price || 0,
           image: '/dethuong.jpg',
           previewImage: '/dethuong.jpg',
           type: 'custom'
         };
        return {
          ...item,
          productInfo
        };
      }
      
      // Sản phẩm bình thường hoặc design từ database
      const productInfo = {
        _id: product?._id?.toString() || item.product,
        name: product?.name || product?.designName || 'Sản phẩm không xác định',
        designName: product?.designName || null,
        description: product?.description || '',
        price: product?.price || 0,
        image: product?.image || product?.previewImage || '/placeholder.jpg',
        previewImage: product?.previewImage || product?.image || '/placeholder.jpg',
        type: product?.type || (isDesign ? 'design' : 'product')
      };
      
      return {
        ...item,
        productInfo
      };
    }));

    const order = new Order({ user, products: productsWithInfo, totalPrice, name, phone, address, paymentMethod, coupon, discountAmount, shippingFee });
    await order.save();
    
    // Cập nhật số lần sử dụng của mã giảm giá nếu có
    if (coupon) {
      try {
        // Đảm bảo coupon là ObjectId hợp lệ
        if (mongoose.Types.ObjectId.isValid(coupon)) {
          await Coupon.findByIdAndUpdate(coupon, { $inc: { usedCount: 1 } });
          console.log('Đã cập nhật usedCount cho coupon:', coupon);
        } else {
          console.log('Coupon ID không hợp lệ:', coupon);
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật usedCount:', error);
      }
    }
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
    console.error('Error creating order:', error);
    res.status(400).json({ message: 'Lỗi khi tạo đơn hàng: ' + error.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    // Sử dụng productInfo nếu có, nếu không thì populate như cũ
    for (let order of orders) {
      for (let productItem of order.products) {
        if (productItem.productInfo) {
          // Sử dụng thông tin đã lưu sẵn
          productItem.product = productItem.productInfo;
        } else {
          // Fallback: populate như cũ cho đơn hàng cũ
          if (productItem.product && mongoose.Types.ObjectId.isValid(productItem.product)) {
            let product = await Product.findById(productItem.product);
            if (!product) {
              product = await Design.findById(productItem.product);
            }
            
            // Đảm bảo product có image
            if (product) {
              // Nếu không có image, thử dùng images[0]
              if (!product.image && product.images && product.images.length > 0) {
                product.image = product.images[0];
              }
              // Nếu vẫn không có image, dùng placeholder
              if (!product.image) {
                product.image = '/placeholder.jpg';
              }
              
              productItem.product = product;
            } else {
              // Nếu không tìm thấy sản phẩm trong database, tạo fallback
              productItem.product = {
                _id: productItem.product,
                name: 'Sản phẩm không còn tồn tại',
                designName: null,
                description: 'Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng',
                price: 0,
                image: '/placeholder.jpg',
                previewImage: '/placeholder.jpg',
                type: 'deleted'
              };
            }
          } else {
            // Nếu product không phải ObjectId hợp lệ, có thể là custom design
            productItem.product = {
              _id: productItem.product,
              name: 'Sản phẩm tùy chỉnh',
              designName: null,
              description: '',
              price: 0,
              image: '/dethuong.jpg',
              previewImage: '/dethuong.jpg',
              type: 'custom'
            };
          }
        }
      }
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Error in getOrdersByUser:', error);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Thu thập tất cả product IDs để query một lần
    const productIds = [];
    const designIds = [];
    
    for (let order of orders) {
      for (let productItem of order.products) {
        if (!productItem.productInfo && productItem.product && mongoose.Types.ObjectId.isValid(productItem.product)) {
          productIds.push(productItem.product);
        }
      }
    }
    
    // Query tất cả products và designs một lần
    const products = await Product.find({ _id: { $in: productIds } });
    const designs = await Design.find({ _id: { $in: productIds } });
    
    // Tạo map để lookup nhanh
    const productMap = new Map();
    const designMap = new Map();
    
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });
    
    designs.forEach(design => {
      designMap.set(design._id.toString(), design);
    });
    
    // Xử lý orders
    for (let order of orders) {
      for (let productItem of order.products) {
        if (productItem.productInfo) {
          productItem.product = productItem.productInfo;
        } else {
          if (productItem.product && mongoose.Types.ObjectId.isValid(productItem.product)) {
            let product = productMap.get(productItem.product.toString()) || designMap.get(productItem.product.toString());
            
            // Đảm bảo product có image
            if (product) {
              // Nếu không có image, thử dùng images[0]
              if (!product.image && product.images && product.images.length > 0) {
                product.image = product.images[0];
              }
              // Nếu vẫn không có image, dùng placeholder
              if (!product.image) {
                product.image = '/placeholder.jpg';
              }
              
              productItem.product = product;
            } else {
              // Nếu không tìm thấy sản phẩm trong database, tạo fallback
              productItem.product = {
                _id: productItem.product,
                name: 'Sản phẩm không còn tồn tại',
                designName: null,
                description: 'Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng',
                price: 0,
                image: '/placeholder.jpg',
                previewImage: '/placeholder.jpg',
                type: 'deleted'
              };
            }
          } else {
            // Nếu product không phải ObjectId hợp lệ, có thể là custom design
            productItem.product = {
              _id: productItem.product,
              name: 'Sản phẩm tùy chỉnh',
              designName: null,
              description: '',
              price: 0,
              image: '/dethuong.jpg',
              previewImage: '/dethuong.jpg',
              type: 'custom'
            };
          }
        }
      }
    }
    
    // Lấy tổng số đơn hàng cho pagination
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    
    res.json({
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    
    // Sử dụng productInfo nếu có, nếu không thì populate như cũ
    for (let productItem of order.products) {
      if (productItem.productInfo) {
        productItem.product = productItem.productInfo;
      } else {
        if (productItem.product && mongoose.Types.ObjectId.isValid(productItem.product)) {
          let product = await Product.findById(productItem.product);
          if (!product) {
            product = await Design.findById(productItem.product);
          }
          
          // Đảm bảo product có image
          if (product) {
            // Nếu không có image, thử dùng images[0]
            if (!product.image && product.images && product.images.length > 0) {
              product.image = product.images[0];
            }
            // Nếu vẫn không có image, dùng placeholder
            if (!product.image) {
              product.image = '/placeholder.jpg';
            }
            
            productItem.product = product;
          } else {
            // Nếu không tìm thấy sản phẩm trong database, tạo fallback
            productItem.product = {
              _id: productItem.product,
              name: 'Sản phẩm không còn tồn tại',
              designName: null,
              description: 'Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng',
              price: 0,
              image: '/placeholder.jpg',
              previewImage: '/placeholder.jpg',
              type: 'deleted'
            };
          }
        } else {
          // Nếu product không phải ObjectId hợp lệ, có thể là custom design
          productItem.product = {
            _id: productItem.product,
            name: 'Sản phẩm tùy chỉnh',
            designName: null,
            description: '',
            price: 0,
            image: '/dethuong.jpg',
            previewImage: '/dethuong.jpg',
            type: 'custom'
          };
        }
      }
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
