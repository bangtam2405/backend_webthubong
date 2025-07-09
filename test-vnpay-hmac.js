const crypto = require('crypto');

// Thay đổi giá trị này theo log backend của bạn
const signData = 'vnp_Amount=1200000&vnp_Command=pay&vnp_CreateDate=20250624070528&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh toán đơn hàng cho 1&vnp_OrderType=other&vnp_ReturnUrl=http://localhost:3000/payment-result&vnp_TmnCode=THTA3CSO&vnp_TxnRef=140528&vnp_Version=2.1.0';
const secretKey = 'IHFIM7TF68BB306MDOOFEEALA848HI6L';

const hmac = crypto.createHmac('sha512', secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
console.log('HMAC SHA512:', signed); 