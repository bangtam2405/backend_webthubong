// models/Category.js
const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  type: { type: String, required: true }, // "body", "ear", "eye", "clothing", "accessory", "option"
  image: String,
  price: Number,
  imported: { type: Number, default: 0 }, // Tổng nhập về
  sold: { type: Number, default: 0 },     // Số lượng đã bán
  stock: { type: Number, default: 0 }     // Tồn kho (tự động tính = imported - sold)
});
module.exports = mongoose.model('Category', CategorySchema);