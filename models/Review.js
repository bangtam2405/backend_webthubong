const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  media: [{
    type: String,
    trim: true,
  }],
  orderItem: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Order.products',
  },
}, { timestamps: true });

// Đảm bảo mỗi người dùng chỉ đánh giá 1 lần cho 1 sản phẩm trong 1 order item
reviewSchema.index({ product: 1, user: 1, orderItem: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema); 