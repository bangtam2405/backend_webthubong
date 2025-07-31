const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // phải đúng với tên model User
    required: true
  },
  products: [
    {
      _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  totalPrice: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [
      'Chờ xác nhận', // pending
      'Đã xác nhận',  // confirmed
      'Đang xử lý',   // processing
      'Đang giao hàng', // shipping
      'Đã giao hàng', // delivered
      'Đã hủy'        // cancelled
    ],
    default: 'Chờ xác nhận'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'VNPay', 'Momo'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  coupon: { type: String },
  discountAmount: { type: Number, default: 0 },
  cancelReason: {
    type: String,
    default: ''
  },
  cancelNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
