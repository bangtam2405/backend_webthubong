// routes/category.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Lấy tất cả danh mục
router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// Thêm danh mục mới
router.post('/', async (req, res) => {
  const { name, parent, type, image, price } = req.body;
  const category = new Category({ name, parent, type, image, price });
  await category.save();
  res.json(category);
});

// Sửa danh mục (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parent, type, image, price } = req.body;
  try {
    const updated = await Category.findByIdAndUpdate(
      id,
      { name, parent, type, image, price },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa danh mục (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});
module.exports = router;