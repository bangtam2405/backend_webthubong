const Part = require("../models/Part");
const mongoose = require("mongoose");

// Thêm part mới
exports.addPart = async (req, res) => {
  try {
    const { name, category, image } = req.body;

    // Kiểm tra category có phải ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Category không hợp lệ" });
    }

    const newPart = new Part({
      name,
      category,
      image,
    });

    await newPart.save();

    // Populate để trả về category chi tiết luôn
    const populatedPart = await newPart.populate("category");

    res.status(201).json({ message: "Thêm part thành công", part: populatedPart });
  } catch (error) {
    console.error("Lỗi thêm part:", error);
    res.status(500).json({ message: "Lỗi khi thêm part", error: error.message });
  }
};

// Lấy tất cả parts (populate category)
exports.getAllParts = async (req, res) => {
  try {
    const parts = await Part.find().populate("category");
    res.status(200).json(parts);
  } catch (error) {
    console.error("Lỗi lấy danh sách part:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách part", error: error.message });
  }
};

// Lấy parts theo category id
exports.getPartsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "ID category không hợp lệ" });
    }

    const parts = await Part.find({ category: categoryId }).populate("category");
    res.status(200).json(parts);
  } catch (error) {
    console.error("Lỗi lấy parts theo category:", error);
    res.status(500).json({ message: "Lỗi khi lấy parts theo category", error: error.message });
  }
};
