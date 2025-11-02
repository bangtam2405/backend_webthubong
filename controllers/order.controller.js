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
    let { user, products, totalPrice, name, phone, address, paymentMethod, coupon, discountAmount, shippingFee, customerNote } = req.body;
      // console.log('=== createOrder START ===');
  // console.log('Raw request body products:', JSON.stringify(products, null, 2));
    // Ép userId về ObjectId nếu là string
    if (user && typeof user === "string" && mongoose.Types.ObjectId.isValid(user)) {
      user = new mongoose.Types.ObjectId(user);
    }
    // Kiểm tra tồn kho từng sản phẩm
    for (const item of products) {
              // console.log('Checking stock for product:', item.product);
      
      // Kiểm tra xem _id có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        // console.log('Invalid ObjectId, skipping stock check (likely custom design)');
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
        // console.log('Product not found in database, skipping stock check (likely custom design)');
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
    const productsWithInfo = await Promise.all(products.map(async (item, idx) => {
      // console.log(`\n-- Processing incoming product[${idx}] --`);
      // console.log('Incoming item:', JSON.stringify(item, null, 2));
      // console.log('=== Processing item ===');
      // console.log('Item:', JSON.stringify(item, null, 2));
      
      // Kiểm tra xem _id có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        // Custom design - sử dụng thông tin được gửi từ frontend
        // console.log('=== Processing custom design item ===');
        // console.log('Raw item:', JSON.stringify(item, null, 2));
        // console.log('item.size:', item.size);
        // console.log('item.material:', item.material);
        // console.log('item.specifications:', item.specifications);
        // console.log('item.description:', item.description);
        
        // Trích xuất kích thước và chất liệu từ specifications trước
        let sizeText = '';
        let materialText = '';
        
        // Ưu tiên lấy từ specifications
        if (item.specifications) {
          sizeText = item.specifications.sizeName || item.specifications.size || '';
          materialText = item.specifications.material || '';
        }
        
        // Nếu không có từ specifications, lấy từ item trực tiếp
        if (!sizeText) {
          sizeText = item.size || '';
        }
        if (!materialText) {
          materialText = item.material || '';
        }
        
        // Fallback từ description nếu thiếu
        if (!sizeText && item.description) {
          const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(item.description)?.[1]?.trim();
          sizeText = sizeFromDesc || '';
          // console.log('sizeText from description:', sizeText);
        }
        
        if (!materialText && item.description) {
          const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(item.description)?.[1]?.trim();
          materialText = materialFromDesc || '';
          // console.log('materialText from description:', materialText);
        }
        
        // console.log('Final sizeText:', sizeText);
        // console.log('Final materialText:', materialText);
        
        const productInfo = {
          _id: item.product,
          name: item.name || 'Sản phẩm tùy chỉnh',
          designName: item.designName || null,
          description: item.description || '',
          price: item.price || 0,
          image: item.image || item.previewImage || '/dethuong.jpg',
          previewImage: item.previewImage || item.image || '/dethuong.jpg',
          type: 'custom',
          specifications: item.specifications || null,
          sizeText: sizeText,
          materialText: materialText
        };
        
        // console.log('Created productInfo:', JSON.stringify(productInfo, null, 2));
        // console.log('productInfo type:', typeof productInfo);
        // console.log('productInfo keys:', Object.keys(productInfo));
        
        const result = {
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          designName: item.designName,
          description: item.description,
          image: item.image,
          previewImage: item.previewImage,
          specifications: item.specifications,
          size: item.size,
          material: item.material,
          productInfo: productInfo
        };
        
        // console.log('Result item with productInfo:', JSON.stringify(result, null, 2));
        // console.log('Result productInfo type:', typeof result.productInfo);
        // console.log('Result productInfo keys:', Object.keys(result.productInfo));
        
        // console.log('Return item (custom):', JSON.stringify(result, null, 2));
        return result;
      }
      
      let product = await Product.findById(item.product);
      let isDesign = false;
      
      if (!product) {
        product = await Design.findById(item.product);
        isDesign = true;
      }
      
        // Nếu vẫn không tìm thấy, có thể là design tạm thời từ giỏ hàng
        if (!product) {
          // Trích xuất kích thước và chất liệu từ specifications trước
          let sizeText = '';
          let materialText = '';
          
          // Ưu tiên lấy từ specifications
          if (item.specifications) {
            sizeText = item.specifications.sizeName || item.specifications.size || '';
            materialText = item.specifications.material || '';
          }
          
          // Nếu không có từ specifications, lấy từ item trực tiếp
          if (!sizeText) {
            sizeText = item.size || '';
          }
          if (!materialText) {
            materialText = item.material || '';
          }
          
          // Fallback từ description nếu thiếu
          if (!sizeText && item.description) {
            const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(item.description)?.[1]?.trim();
            sizeText = sizeFromDesc || '';
          }
          
          if (!materialText && item.description) {
            const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(item.description)?.[1]?.trim();
            materialText = materialFromDesc || '';
          }
          
          const productInfo = {
            _id: item.product,
            name: item.name || 'Sản phẩm tùy chỉnh',
            designName: item.designName || null,
            description: item.description || '',
            price: item.price || 0,
            image: item.image || item.previewImage || '/dethuong.jpg',
            previewImage: item.previewImage || item.image || '/dethuong.jpg',
            type: 'custom',
            specifications: item.specifications || null,
            sizeText: sizeText,
            materialText: materialText
          };
          const ret = {
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            designName: item.designName,
            description: item.description,
            image: item.image,
            previewImage: item.previewImage,
            specifications: item.specifications,
            size: item.size,
            material: item.material,
            productInfo: productInfo
          };
          // console.log('Return item (temp design):', JSON.stringify(ret, null, 2));
          return ret;
        }
      
                // Sản phẩm bình thường hoặc design từ database
          const productInfo = {
            _id: product?._id?.toString() || item.product,
            name: product?.name || product?.designName || 'Sản phẩm không xác định',
            designName: product?.designName || null,
            description: product?.description || '',
            price: product?.price || item.price || 0,
            image: product?.image || product?.previewImage || item.image || '/placeholder.jpg',
            previewImage: product?.previewImage || product?.image || item.previewImage || '/placeholder.jpg',
            type: product?.type || (isDesign ? 'design' : 'product'),
            specifications: product?.specifications || item.specifications || null,
            sizeText: (item.specifications?.sizeName || '') || (product?.specifications?.sizeName || '') || item.size || (/Kích thước\s*:\s*([^;]+)/i.exec(item.description || product?.description || '')?.[1] || ''),
            materialText: (item.specifications?.material || '') || (product?.specifications?.material || '') || item.material || (/Chất liệu\s*:\s*([^;]+)/i.exec(item.description || product?.description || '')?.[1] || '')
          };
          
          // Đảm bảo sizeText và materialText luôn có giá trị
          if (!productInfo.sizeText && productInfo.description) {
            const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(productInfo.description)?.[1]?.trim();
            productInfo.sizeText = sizeFromDesc || '';
          }
          
          if (!productInfo.materialText && productInfo.description) {
            const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(productInfo.description)?.[1]?.trim();
            productInfo.materialText = materialFromDesc || '';
          }
          
          // Nếu vẫn không có, thử lấy từ specifications
          if (!productInfo.sizeText && productInfo.specifications) {
            productInfo.sizeText = productInfo.specifications.size || productInfo.specifications.sizeName || '';
          }
          
          if (!productInfo.materialText && productInfo.specifications) {
            productInfo.materialText = productInfo.specifications.material || productInfo.specifications.materialName || '';
          }
      
      const ret = {
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        designName: item.designName,
        description: item.description,
        image: item.image,
        previewImage: item.previewImage,
        specifications: item.specifications,
        size: item.size,
        material: item.material,
        productInfo: productInfo
      };
              // console.log('Return item (db product/design):', JSON.stringify(ret, null, 2));
      return ret;
    }));

    // console.log('\n=== productsWithInfo RESULT ===');
    // console.log(JSON.stringify(productsWithInfo, null, 2));

    // Chuẩn bị products cho việc lưu vào database
    const productsForSave = productsWithInfo.map(item => {
      // console.log('=== Processing item for save ===');
      // console.log('Original item:', JSON.stringify(item, null, 2));
      // console.log('productInfo type:', typeof item.productInfo);
      // console.log('productInfo value:', item.productInfo);
      // console.log('productInfo keys:', item.productInfo && typeof item.productInfo === 'object' ? Object.keys(item.productInfo) : 'N/A');
      
      // Đảm bảo productInfo không bị ghi đè
      const saveItem = {
        product: item.product, // Giữ nguyên product ID (có thể là string hoặc ObjectId)
        quantity: item.quantity,
        productInfo: { ...item.productInfo } // Tạo copy để tránh bị ghi đè
      };
      
              // console.log('Save item:', JSON.stringify(saveItem, null, 2));
        // console.log('Save item productInfo type:', typeof saveItem.productInfo);
        // console.log('Save item productInfo keys:', saveItem.productInfo && typeof saveItem.productInfo === 'object' ? Object.keys(saveItem.productInfo) : 'N/A');
      
      return saveItem;
    });

    console.log('=== Final products for save (pre-plain) ===');
    console.log('Products for save:', JSON.stringify(productsForSave, null, 2));

    // Tạo bản sao thuần (plain objects) để tránh bất kỳ mutation/casting nào không mong muốn
    const productsFinal = productsWithInfo.map((it, idx) => {
      const plainProductInfo = it.productInfo ? JSON.parse(JSON.stringify(it.productInfo)) : null;
              // console.log(`Product ${idx} final productInfo:`, plainProductInfo);
      return {
        product: it.product,
        quantity: it.quantity,
        productInfo: plainProductInfo
      };
    });

    // console.log('=== Products FINAL (plain) ===');
    // console.log(JSON.stringify(productsFinal, null, 2));
    
    // Tạo order với products đã được xử lý
    const orderData = {
      user,
      products: productsFinal,
      totalPrice,
      name,
      phone,
      address,
      paymentMethod,
      coupon,
      discountAmount,
      shippingFee,
      customerNote: customerNote || ''
    };
    
    // console.log('=== Order data before creation ===');
    // console.log('Order data products:', JSON.stringify(orderData.products, null, 2));
    
    const order = new Order(orderData);
    
    // Kiểm tra lại products sau khi tạo Order object
    // console.log('=== Order after creation ===');
    // console.log('Order products:', JSON.stringify(order.products, null, 2));
    
    // Đảm bảo productInfo vẫn là object
    order.products.forEach((prod, index) => {
      if (prod.productInfo && typeof prod.productInfo !== 'object') {
        console.warn(`Fixing productInfo for index ${index}:`, prod.productInfo);
        prod.productInfo = productsFinal[index].productInfo;
      }
    });
    
    await order.save();
    
    // console.log('=== Order after save ===');
    // console.log('Saved order products:', JSON.stringify(order.products, null, 2));
    // console.log('Saved order products[0].productInfo type:', typeof order.products[0]?.productInfo);
    // console.log('Saved order products[0].productInfo value:', order.products[0]?.productInfo);
    // console.log('Saved order products[0].productInfo keys:', order.products[0]?.productInfo && typeof order.products[0]?.productInfo === 'object' ? Object.keys(order.products[0]?.productInfo) : 'N/A');
    
    // Log chi tiết từng product sau khi save
    order.products.forEach((prod, index) => {
      console.log(`Product ${index} after save:`, {
        product: prod.product,
        productInfo: prod.productInfo,
        productInfoType: typeof prod.productInfo,
        productInfoKeys: prod.productInfo && typeof prod.productInfo === 'object' ? Object.keys(prod.productInfo) : 'N/A'
      });
    });

    // Tăng 'sold' cho các Category part của sản phẩm tuỳ chỉnh (body, eyes, mouth, accessories)
    try {
      const incSoldForVal = async (val, qty) => {
        if (!val) return;
        const v = String(val).trim();
        if (!v) return;
        if (mongoose.Types.ObjectId.isValid(v)) {
          await Category.findByIdAndUpdate(v, { $inc: { sold: qty, stock: -qty } });
        } else {
          await Category.findOneAndUpdate({ name: v }, { $inc: { sold: qty, stock: -qty } });
        }
      };
      for (const item of productsWithInfo) {
        const info = item.productInfo || {};
        if (info && info.type === 'custom' && info.specifications) {
          const qty = Number(item.quantity) || 1;
          const specs = info.specifications || {};
          await incSoldForVal(specs.body, qty);
          await incSoldForVal(specs.eyes, qty);
          await incSoldForVal(specs.mouth, qty);
          // Accessories có thể là array tên/ID
          if (Array.isArray(specs.accessories)) {
            for (const acc of specs.accessories) {
              await incSoldForVal(acc, 1);
            }
          }
        }
      }
    } catch (e) {
      console.error('Lỗi cập nhật sold cho Category parts:', e.message);
    }
    
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
            // Kiểm tra xem có thông tin tùy chỉnh trong order không
            const customData = productItem.specifications || productItem.customData || {};
            const hasCustomInfo = customData.parts || customData.body || customData.eyes || customData.mouth || customData.furColor;
            
            productItem.product = {
              _id: productItem.product,
              name: 'Sản phẩm tùy chỉnh',
              designName: null,
              description: '',
              price: productItem.price || 0,
              image: '/dethuong.jpg',
              previewImage: '/dethuong.jpg',
              type: 'custom',
              customData: hasCustomInfo ? customData : null,
              specifications: hasCustomInfo ? customData : null
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
            
            // Đảm bảo product có sizeText và materialText
            if (!product.sizeText && product.description) {
              const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(product.description)?.[1]?.trim();
              product.sizeText = sizeFromDesc || '';
            }
            
            if (!product.materialText && product.description) {
              const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(product.description)?.[1]?.trim();
              product.materialText = materialFromDesc || '';
            }
            
            // Nếu vẫn không có, thử lấy từ specifications
            if (!product.sizeText && product.specifications) {
              product.sizeText = product.specifications.size || product.specifications.sizeName || '';
            }
            
            if (!product.materialText && product.specifications) {
              product.materialText = product.specifications.material || product.materialName || '';
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
          // Lấy thông tin từ productInfo nếu có
          let sizeText = '';
          let materialText = '';
          let description = '';
          
          if (productItem.productInfo) {
            sizeText = productItem.productInfo.sizeText || '';
            materialText = productItem.productInfo.materialText || '';
            description = productItem.productInfo.description || '';
          }
          
          // Nếu không có sizeText/materialText, trích xuất từ description
          if (!sizeText && description) {
            const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(description)?.[1]?.trim();
            sizeText = sizeFromDesc || '';
          }
          
          if (!materialText && description) {
            const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(description)?.[1]?.trim();
            materialText = materialFromDesc || '';
          }
          
          productItem.product = {
            _id: productItem.product,
            name: 'Sản phẩm tùy chỉnh',
            designName: null,
            description: description,
            price: productItem.productInfo?.price || 0,
            image: productItem.productInfo?.image || '/dethuong.jpg',
            previewImage: productItem.productInfo?.previewImage || '/dethuong.jpg',
            type: 'custom',
            sizeText: sizeText,
            materialText: materialText
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
    
    console.log('=== getOrderById Debug ===');
    console.log('Order ID:', orderId);
    console.log('Raw order products:', JSON.stringify(order.products, null, 2));
    
    // Sử dụng productInfo nếu có, nếu không thì populate như cũ
    for (let productItem of order.products) {
      console.log('Processing productItem:', {
        _id: productItem._id,
        product: productItem.product,
        productInfo: productItem.productInfo,
        productInfoType: typeof productItem.productInfo,
        productInfoKeys: productItem.productInfo && typeof productItem.productInfo === 'object' ? Object.keys(productItem.productInfo) : 'N/A'
      });
      
      if (productItem.productInfo && typeof productItem.productInfo === 'object') {
        console.log('productInfo is object, processing...');
        // Đảm bảo sizeText và materialText luôn có
        if (!productItem.productInfo.sizeText && productItem.productInfo.description) {
          const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(productItem.productInfo.description)?.[1]?.trim();
          const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(productItem.productInfo.description)?.[1]?.trim();
          productItem.productInfo.sizeText = productItem.productInfo.sizeText || sizeFromDesc || '';
          productItem.productInfo.materialText = productItem.productInfo.materialText || materialFromDesc || '';
        }
        
        // Nếu vẫn không có, thử lấy từ specifications
        if (!productItem.productInfo.sizeText && productItem.productInfo.specifications) {
          productItem.productInfo.sizeText = productItem.productInfo.specifications.size || productItem.productInfo.specifications.sizeName || '';
        }
        
        if (!productItem.productInfo.materialText && productItem.productInfo.specifications) {
          productItem.productInfo.materialText = productItem.productInfo.specifications.material || productItem.productInfo.specifications.materialName || '';
        }
        
        console.log('Final productInfo:', JSON.stringify(productItem.productInfo, null, 2));
        productItem.product = productItem.productInfo;
      } else {
        console.log('productInfo is not object or missing, falling back to populate...');
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
          // Lấy thông tin từ productInfo nếu có
          let sizeText = '';
          let materialText = '';
          let description = '';
          
          if (productItem.productInfo && typeof productItem.productInfo === 'object') {
            sizeText = productItem.productInfo.sizeText || '';
            materialText = productItem.productInfo.materialText || '';
            description = productItem.productInfo.description || '';
          }
          
          // Nếu không có sizeText/materialText, trích xuất từ description
          if (!sizeText && description) {
            const sizeFromDesc = /Kích thước\s*:\s*([^;]+)/i.exec(description)?.[1]?.trim();
            sizeText = sizeFromDesc || '';
          }
          
          if (!materialText && description) {
            const materialFromDesc = /Chất liệu\s*:\s*([^;]+)/i.exec(description)?.[1]?.trim();
            materialText = materialFromDesc || '';
          }
          
          productItem.product = {
            _id: productItem.product,
            name: 'Sản phẩm tùy chỉnh',
            designName: null,
            description: description,
            price: productItem.productInfo && typeof productItem.productInfo === 'object' ? productItem.productInfo.price : 0,
            image: productItem.productInfo && typeof productItem.productInfo === 'object' ? productItem.productInfo.image : '/dethuong.jpg',
            previewImage: productItem.productInfo && typeof productItem.productInfo === 'object' ? productItem.productInfo.previewImage : '/dethuong.jpg',
            type: 'custom',
            sizeText: sizeText,
            materialText: materialText
          };
        }
      }
    }
    
    console.log('Final processed order products:', JSON.stringify(order.products.map(p => ({ 
      _id: p._id, 
      product: p.product ? { 
        _id: p.product._id, 
        name: p.product.name, 
        sizeText: p.product.sizeText, 
        materialText: p.product.materialText 
      } : null 
    })), null, 2));
    
    res.json(order);
  } catch (error) {
    console.error('Error in getOrderById:', error);
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
