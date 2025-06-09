const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl, isCustomizable, parts } = req.body;

    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      isCustomizable,
      parts: isCustomizable ? parts : []
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lỗi khi tạo sản phẩm' });
  }
};
