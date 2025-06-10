// models/Category.js
const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  type: { type: String, required: true }, // "body", "ear", "eye", "clothing", "accessory", "option"
  image: String,
  price: Number
});
module.exports = mongoose.model('Category', CategorySchema);