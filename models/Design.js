// models/Design.js
const mongoose = require("mongoose");

const designSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // nếu có user
  body: { type: String, required: true },
  size: { type: String, required: true },
  furColor: { type: String, required: true },
  ears: { type: String, required: true },
  eyes: { type: String, required: true },
  name: { type: String, required: true },
  clothing: { type: String, required: true },
  accessories: { type: [String], default: [] },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Design", designSchema);
