// models/Product.js
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  isCustomizable: Boolean,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // VD: "Thân"
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Part' }]
});
module.exports = mongoose.model('Product', productSchema);
