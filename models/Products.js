const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  rating: Number,
  reviews: Number,
  type: { type: String, required: true }, // 'teddy', 'accessory', 'collection', ...
  // Thêm các trường đặc thù nếu cần
  // ví dụ: size, color, v.v.
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);