const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  url: { type: String, required: true }, // Đường dẫn ảnh banner
  caption: { type: String, default: '' }, // Tiêu đề hoặc mô tả ngắn
  link: { type: String, default: '' }, // Link khi click vào banner
  order: { type: Number, default: 0 }, // Thứ tự hiển thị
  isActive: { type: Boolean, default: true }, // Có hiển thị hay không
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema); 