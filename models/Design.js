const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // hoặc mongoose.Schema.Types.ObjectId nếu dùng ref User
  designName: { type: String, required: true },
  parts: {
    body: String,
    ears: String,
    eyes: String,
    furColor: String,
    clothing: String,
    accessories: [String],
    name: String,
    size: String,
  },
  canvasJSON: { type: Object, required: true },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Design", DesignSchema);