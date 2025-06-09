const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },  // ví dụ: "ear", "eye", "hat", "clothes", "furColor"
  imageUrl: { type: String, required: true },
  price: { type: Number, default: 0 },
});

module.exports = mongoose.model('Accessory', accessorySchema);
