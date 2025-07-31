const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // hoặc mongoose.Schema.Types.ObjectId nếu dùng ref User
  designName: { type: String, required: true },
  parts: {
    body: String,
    ears: String,
    eyes: String,
    mouth: String, // Thêm dòng này để lưu id miệng
    furColor: String,
    clothing: String,
    accessories: [String],
    name: String,
    size: String,
  },
  price: { type: Number, default: 0 },
  description: { type: String, default: "" },
  previewImage: { type: String, default: "" },
  canvasJSON: { type: Object, required: true },
  isPublic: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Design", DesignSchema);