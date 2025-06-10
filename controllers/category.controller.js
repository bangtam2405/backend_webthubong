const Category = require("../models/Category");

exports.addCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!["body", "feature", "accessory"].includes(type)) {
      return res.status(400).json({ message: "Loại type không hợp lệ" });
    }

    const newCategory = new Category({ name, type });
    await newCategory.save();

    res.status(201).json({ message: "Tạo category thành công", category: newCategory });
  } catch (error) {
    console.error("Lỗi thêm category:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách category", error: error.message });
  }
};
