const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['teddy', 'collection', 'accessory', 'new', 'giftbox'],
    default: 'teddy'
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  icon: {
    type: String,
    default: '📦'
  },
  color: {
    type: String,
    default: '#FF6B9D'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Index để tối ưu query
productCategorySchema.index({ type: 1, isActive: 1 });
productCategorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('ProductCategory', productCategorySchema);