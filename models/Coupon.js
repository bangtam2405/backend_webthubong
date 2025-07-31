const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null là mã global, có userId là mã cá nhân hóa
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'], // Giảm theo phần trăm hay giá cố định
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // Không giới hạn nếu null
  },
  usageLimit: {
    type: Number,
    default: null, // Không giới hạn nếu null
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    default: null, // Không có ngày hết hạn nếu null
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema); 