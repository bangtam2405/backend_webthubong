const Product = require('../models/Products');

// Lấy tất cả sản phẩm, có thể lọc theo type
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy sản phẩm theo id
exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm sản phẩm mới
exports.create = async (req, res) => {
  try {
    const { name, price, type, stock } = req.body;
    if (!name || !price || !type) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }
    // Đảm bảo stock là số >= 0
    const stockValue = typeof stock === 'number' && stock >= 0 ? stock : 0;
    const productData = {
      ...req.body,
      rating: 0,
      reviews: 0,
      sold: 0,
      stock: stockValue,
      featured: req.body.featured || false,
      images: req.body.images || [],
      isCustom: req.body.isCustom || false,
      customData: req.body.customData || {},
      specifications: {
        material: req.body.specifications?.material || '',
        size: req.body.specifications?.size || '',
        weight: req.body.specifications?.weight || '',
        color: req.body.specifications?.color || '',
        body: req.body.specifications?.body || '',
        ears: req.body.specifications?.ears || '',
        eyes: req.body.specifications?.eyes || '',
        nose: req.body.specifications?.nose || '',
        mouth: req.body.specifications?.mouth || '',
        furColor: req.body.specifications?.furColor || '',
        clothing: req.body.specifications?.clothing || '',
        accessories: req.body.specifications?.accessories || []
      }
    };
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Sửa sản phẩm
exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    // Nếu có truyền stock thì cập nhật, nếu không thì giữ nguyên
    const updateData = {
      ...req.body,
      stock: req.body.stock !== undefined ? req.body.stock : product.stock,
      isCustom: req.body.isCustom !== undefined ? req.body.isCustom : product.isCustom,
      customData: req.body.customData || product.customData,
      specifications: {
        material: req.body.specifications?.material || product.specifications?.material || '',
        size: req.body.specifications?.size || product.specifications?.size || '',
        weight: req.body.specifications?.weight || product.specifications?.weight || '',
        color: req.body.specifications?.color || product.specifications?.color || '',
        body: req.body.specifications?.body || product.specifications?.body || '',
        ears: req.body.specifications?.ears || product.specifications?.ears || '',
        eyes: req.body.specifications?.eyes || product.specifications?.eyes || '',
        nose: req.body.specifications?.nose || product.specifications?.nose || '',
        mouth: req.body.specifications?.mouth || product.specifications?.mouth || '',
        furColor: req.body.specifications?.furColor || product.specifications?.furColor || '',
        clothing: req.body.specifications?.clothing || product.specifications?.clothing || '',
        accessories: req.body.specifications?.accessories || product.specifications?.accessories || []
      }
    };
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa sản phẩm
exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật đánh giá sản phẩm
exports.updateRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    // Cập nhật rating và reviews
    const newReviews = product.reviews + 1;
    const newRating = ((product.rating * product.reviews) + rating) / newReviews;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        rating: newRating,
        reviews: newReviews
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật số lượng đã bán
exports.updateSold = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Số lượng trong kho không đủ' });
    }

    // Cập nhật số lượng đã bán và tồn kho
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { sold: quantity, stock: -quantity }
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 