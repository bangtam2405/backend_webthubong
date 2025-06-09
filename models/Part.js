// models/Part.js
const mongoose = require('mongoose');
const partSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});
module.exports = mongoose.model('Part', partSchema);
