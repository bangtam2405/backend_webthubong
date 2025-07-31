const ProductCategory = require('../models/ProductCategory');
const Products = require('../models/Products');

// Lấy tất cả danh mục sản phẩm
exports.getAllProductCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find()
      .sort({ sortOrder: 1, createdAt: -1 });
    
    // Cập nhật số lượng sản phẩm cho mỗi danh mục
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Products.countDocuments({ type: category.type });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );

    res.status(200).json(categoriesWithCount);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh mục sản phẩm theo ID
exports.getProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục sản phẩm' });
    }

    // Đếm số sản phẩm trong danh mục
    const productCount = await Products.countDocuments({ type: category.type });
    const categoryWithCount = {
      ...category.toObject(),
      productCount
    };

    res.status(200).json(categoryWithCount);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo danh mục sản phẩm mới
exports.createProductCategory = async (req, res) => {
  try {
    const { name, type, description, image, icon, color, isActive, sortOrder } = req.body;

    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await ProductCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }

    const newCategory = new ProductCategory({
      name: name.trim(),
      type,
      description: description?.trim(),
      image,
      icon: icon || '📦',
      color: color || '#FF6B9D',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    await newCategory.save();
    res.status(201).json({ 
      message: 'Tạo danh mục sản phẩm thành công', 
      category: newCategory 
    });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật danh mục sản phẩm
exports.updateProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, image, icon, color, isActive, sortOrder } = req.body;

    // Kiểm tra danh mục có tồn tại không
    const existingCategory = await ProductCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục sản phẩm' });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa (trừ chính nó)
    if (name && name.trim() !== existingCategory.name) {
      const duplicateName = await ProductCategory.findOne({ 
        name: name.trim(), 
        _id: { $ne: id } 
      });
      if (duplicateName) {
        return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
      }
    }

    const updateData = {
      name: name?.trim(),
      type,
      description: description?.trim(),
      image,
      icon,
      color,
      isActive,
      sortOrder
    };

    // Loại bỏ các trường undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: 'Cập nhật danh mục sản phẩm thành công', 
      category: updatedCategory 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa danh mục sản phẩm
exports.deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra danh mục có tồn tại không
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục sản phẩm' });
    }

    // Kiểm tra có sản phẩm nào trong danh mục không
    const productCount = await Products.countDocuments({ type: category.type });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa danh mục. Có ${productCount} sản phẩm đang sử dụng danh mục này.` 
      });
    }

    await ProductCategory.findByIdAndDelete(id);
    res.status(200).json({ message: 'Xóa danh mục sản phẩm thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh mục sản phẩm đang hoạt động (cho frontend)
exports.getActiveProductCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('name type description image icon color');
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục sản phẩm đang hoạt động:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật thứ tự danh mục
exports.updateCategoryOrder = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, sortOrder }
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    // Cập nhật thứ tự cho từng danh mục
    await Promise.all(
      categories.map(async ({ id, sortOrder }) => {
        await ProductCategory.findByIdAndUpdate(id, { sortOrder });
      })
    );

    res.status(200).json({ message: 'Cập nhật thứ tự danh mục thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật thứ tự danh mục:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};