const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  type: { 
    type: String, 
    required: true,
    enum: ['teddy', 'accessory', 'collection', 'new', 'custom', 'giftbox']
  },
  isCustom: { type: Boolean, default: false },
  customData: {
    parts: Object,
    canvasJSON: Object
  },
  customizeLink: String, // Link mẫu thiết kế
  specifications: {
    material: String,
    size: String,
    weight: String,
    color: String,
    body: String,
    ears: String,
    eyes: String,
    nose: String,
    mouth: String,
    furColor: String,
    clothing: String,
    accessories: [String]
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 