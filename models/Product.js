const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  categoryGroup: { type: String, required: true }, // vd: "Phụ kiện"
  categoryName: { type: String, required: true }, // vd: "Tai"
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  // ... các trường khác nếu cần
})

module.exports = mongoose.model('Product', ProductSchema)
