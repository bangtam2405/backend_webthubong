// routes/category.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Lấy tất cả danh mục
router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// Lấy category theo ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy mục' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Thêm danh mục mới
router.post('/', async (req, res) => {
  const { name, parent, type, image, price, quantity } = req.body;
  const imported = quantity ? Number(quantity) : 0;
  const sold = 0;
  const stock = imported - sold;
  
  const category = new Category({ 
    name, 
    parent, 
    type, 
    image, 
    price,
    imported,
    sold,
    stock
  });
  await category.save();
  res.json(category);
});

// Sửa danh mục (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parent, type, image, price, imported, sold } = req.body;
  const stock = (imported || 0) - (sold || 0);
  
  try {
    const updated = await Category.findByIdAndUpdate(
      id,
      { name, parent, type, image, price, imported, sold, stock },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cập nhật hàng loạt - đổi tên từ "tai" thành "miệng"
router.put('/bulk/rename-tai-to-mieng', async (req, res) => {
  try {
    console.log('API bulk update được gọi');
    
    // Tìm tất cả danh mục có tên chứa "tai"
    const taiCategories = await Category.find({ name: { $regex: /tai/i } });
    console.log('Tìm thấy danh mục tai:', taiCategories.length);
    
    if (taiCategories.length === 0) {
      return res.json({ 
        success: true, 
        message: 'Không tìm thấy danh mục nào có tên chứa "tai"',
        modifiedCount: 0
      });
    }
    
    // Cập nhật từng danh mục
    let updatedCount = 0;
    for (const category of taiCategories) {
      await Category.findByIdAndUpdate(category._id, {
        name: "miệng",
        type: "mouth"
      });
      updatedCount++;
    }
    
    console.log('Đã cập nhật:', updatedCount, 'danh mục');
    
    res.json({ 
      success: true, 
      message: `Đã cập nhật ${updatedCount} danh mục từ "tai" thành "miệng"`,
      modifiedCount: updatedCount
    });
  } catch (err) {
    console.error('Lỗi cập nhật hàng loạt:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
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