const Category = require("../models/Category");

exports.addCategory = async (req, res) => {
  try {
    const { name, type, quantity } = req.body;

    if (!["body", "feature", "accessory"].includes(type)) {
      return res.status(400).json({ message: "Loại type không hợp lệ" });
    }

    const categoryData = { name, type };
    if (typeof quantity === 'number' && quantity >= 0) {
      categoryData.quantity = quantity;
    }
    const newCategory = new Category(categoryData);
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

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.quantity !== undefined) {
      updateData.quantity = typeof updateData.quantity === 'number' && updateData.quantity >= 0 ? updateData.quantity : 0;
    }
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) return res.status(404).json({ message: 'Không tìm thấy category' });
    res.json({ message: 'Cập nhật category thành công', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật category', error: error.message });
  }
};
