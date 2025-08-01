const qs = require('qs');
const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');

// VNPay
exports.createVNPayUrl = async (req, res) => {
  try {
    const { amount, products, name, phone, address, user, returnUrl } = req.body;
    // 1. Tạo đơn hàng trước
    // Xử lý products để tạo productInfo như trong order.controller.js
    const mongoose = require('mongoose');
    const Product = require('../models/Products');
    const Design = require('../models/Design');
    
    const productsWithInfo = await Promise.all(products.map(async (item) => {
      console.log('Processing product item for VNPay:', item);
      
      // Kiểm tra xem _id có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        console.log('Invalid ObjectId, using item data directly');
        return {
          ...item,
          productInfo: {
            _id: item.product,
            name: item.name || 'Sản phẩm tùy chỉnh',
            designName: item.designName || null,
            description: item.description || '',
            price: item.price || 0,
            image: '/dethuong.jpg',
            previewImage: '/dethuong.jpg',
            type: item.type || 'custom'
          }
        };
      }
      
      let product = await Product.findById(item.product);
      let isDesign = false;
      
      if (!product) {
        console.log('Product not found, trying Design...');
        product = await Design.findById(item.product);
        isDesign = true;
      }
      
      // Nếu vẫn không tìm thấy, có thể là design tạm thời từ giỏ hàng
      if (!product) {
        console.log('Neither Product nor Design found, using item data');
        return {
          ...item,
          productInfo: {
            _id: item.product,
            name: item.name || 'Sản phẩm tùy chỉnh',
            designName: item.designName || null,
            description: item.description || '',
            price: item.price || 0,
            image: '/dethuong.jpg',
            previewImage: '/dethuong.jpg',
            type: item.type || 'custom'
          }
        };
      }
      
      console.log('Product/Design found:', product.name || product.designName);
      
      return {
        ...item,
        productInfo: {
          _id: product?._id?.toString() || item.product,
          name: product?.name || product?.designName || 'Sản phẩm không xác định',
          designName: product?.designName || null,
          description: product?.description || '',
          price: product?.price || 0,
          image: product?.image || product?.previewImage || '',
          previewImage: product?.previewImage || product?.image || '',
          type: product?.type || (isDesign ? 'design' : 'product')
        }
      };
    }));

    const order = new Order({
      user,
      products: productsWithInfo,
      totalPrice: amount,
      name,
      phone,
      address,
      paymentMethod: 'VNPay', // Thêm phương thức thanh toán
    });
    await order.save();
    const orderId = order._id.toString();

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    var ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

    const now = new Date();
    const createDate = formatVNPayDate(now);
    const expireDate = formatVNPayDate(new Date(now.getTime() + 15 * 60000));

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: String(tmnCode),
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId, // Dùng orderId làm mã giao dịch
      vnp_OrderInfo: `Thanh-toan-don-hang-${orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: String(returnUrl),
      vnp_IpAddr: String(ipAddr),
      vnp_CreateDate: String(createDate),
      vnp_ExpireDate: String(expireDate),
    };

    vnp_Params = sortObject(vnp_Params);
    const signData = Object.keys(vnp_Params)
        .map(key => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
        .join('&');
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    const paymentUrl = vnpUrl + '?' + Object.keys(vnp_Params)
        .map(key => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
        .join('&');
    res.json({ paymentUrl });
  } catch (err) {
    console.error('VNPay error:', err);
    res.status(500).json({ error: err.message });
  }
};

// VNPay - Xử lý callback cập nhật trạng thái đơn hàng
exports.vnpayReturn = async (req, res) => {
  try {
    let vnpParams = req.query;
    let secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = sortObject(vnpParams);

    const secretKey = process.env.VNP_HASHSECRET;
    const signData = Object.keys(vnpParams)
      .map(key => `${key}=${encodeURIComponent(vnpParams[key] || '').replace(/%20/g, '+')}`)
      .join('&');
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.json({ code: '97', message: 'Chữ ký không hợp lệ' });
    }

    const orderId = vnpParams['vnp_TxnRef'];
    const rspCode = vnpParams['vnp_ResponseCode'];

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ code: '01', message: 'Không tìm thấy đơn hàng' });
    }

    if (order.paymentStatus === 'success') {
      return res.json({ code: '02', message: 'Đơn hàng đã được xác nhận trước đó' });
    }

    if (rspCode === '00') {
      order.status = 'Đã xác nhận';
      order.paymentStatus = 'success';
      order.transactionId = vnpParams['vnp_TransactionNo'];
      await order.save();
      return res.json({ code: '00', message: 'Thanh toán thành công' });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.json({ code: rspCode, message: 'Thanh toán thất bại' });
    }
  } catch (err) {
    console.error('VNPay return error:', err);
    res.status(500).json({ code: '99', message: 'Lỗi server khi xử lý phản hồi VNPay' });
  }
};

// MoMo
exports.createMoMoUrl = async (req, res) => {
  const { amount, orderId, orderInfo, returnUrl, notifyUrl } = req.body;
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const requestType = "captureWallet";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${orderId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const body = {
    partnerCode,
    accessKey,
    requestId: orderId,
    amount: `${amount}`,
    orderId,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: notifyUrl,
    extraData: "",
    requestType,
    signature,
    lang: "vi"
  };

  try {
    const momoRes = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json({ paymentUrl: momoRes.data.payUrl });
  } catch (err) {
    console.error('MoMo error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

// MoMo IPN/Notify handler
exports.momoNotify = (req, res) => {
  const {
    partnerCode, accessKey, requestId, amount, orderId, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature
  } = req.body;
  const secretKey = process.env.MOMO_SECRET_KEY;

  // Tạo raw signature giống như MoMo docs
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const expectedSignature = require('crypto').createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  if (signature === expectedSignature) {
    // Xác thực thành công
    // TODO: cập nhật trạng thái đơn hàng trong DB
    console.log('MoMo IPN xác thực thành công:', req.body);
    res.json({ resultCode: 0, message: 'Confirm Success' });
  } else {
    // Xác thực thất bại
    console.log('MoMo IPN xác thực thất bại:', req.body);
    res.json({ resultCode: 1, message: 'Confirm Fail' });
  }
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
  return sorted;
}

// Hàm format ngày theo chuẩn VNPay (GMT+7)
function formatVNPayDate(date) {
  const tzOffset = 7 * 60; // phút
  const local = new Date(date.getTime() + tzOffset * 60000);
  const yyyy = local.getFullYear();
  const MM = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  const HH = String(local.getHours()).padStart(2, '0');
  const mm = String(local.getMinutes()).padStart(2, '0');
  const ss = String(local.getSeconds()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
} 