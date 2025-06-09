// models/Category.js
const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ví dụ: "Tai", "Thân", "Mắt"
  type: { type: String, enum: ['base', 'feature', 'accessory'] } // thân, đặc điểm, phụ kiện
});
module.exports = mongoose.model('Category', categorySchema);
