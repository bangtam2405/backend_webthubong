const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentGateway: {
    type: String,
    required: true,
    enum: ['VNPay', 'MoMo', 'COD'],
  },
  transactionId: {
    type: String,
    unique: true, // Mã giao dịch từ cổng thanh toán
    sparse: true, // Cho phép nhiều null values nếu không phải tất cả giao dịch đều có transactionId
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  },
  responseCode: String, // Mã phản hồi từ cổng thanh toán
  message: String,      // Thông báo từ cổng thanh toán
  rawResponse: Schema.Types.Mixed, // Lưu trữ toàn bộ response từ cổng thanh toán
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema); 