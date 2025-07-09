const mongoose = require('mongoose');

const GiftBoxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('GiftBox', GiftBoxSchema); 