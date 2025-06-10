// model/PartCategory.js
const mongoose = require("mongoose");

const partCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String }, // nếu có icon
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "PartCategory", default: null },
  type: { type: String, enum: ["category", "option"], default: "category" }, // "option" là leaf cuối như "Tai tròn"
});

module.exports = mongoose.model("PartCategory", partCategorySchema);