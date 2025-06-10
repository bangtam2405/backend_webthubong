const Product = require('../models/Product')

// Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { name, description, categoryGroup, categoryName, price, quantity } = req.body

    // Validate bắt buộc có nhóm và loại danh mục
    if (!name || !categoryGroup || !categoryName) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' })
    }

    // Tạo mới
    const newProduct = new Product({
      name,
      description,
      categoryGroup,
      categoryName,
      price,
      quantity,
    })

    await newProduct.save()
    return res.status(201).json({ message: 'Thêm sản phẩm thành công', product: newProduct })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Lỗi server' })
  }
}
