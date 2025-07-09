const Cart = require('../models/Cart');
const Product = require('../models/Products'); // Giả định Product model là Products.js

// Lấy giỏ hàng của người dùng
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId; // userId từ middleware auth
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ items: [] }); // Trả về giỏ hàng rỗng nếu chưa có
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng', error: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Nếu chưa có giỏ hàng, tạo mới
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Sản phẩm đã có trong giỏ, cập nhật số lượng
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Sản phẩm chưa có trong giỏ, thêm mới
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    // Populate lại để trả về thông tin sản phẩm chi tiết
    cart = await cart.populate('items.product');
    res.status(200).json({ message: 'Sản phẩm đã được thêm vào giỏ hàng', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng', error: error.message });
  }
};

// Cập nhật số lượng của một sản phẩm cụ thể trong giỏ hàng
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        // Nếu số lượng là 0 hoặc âm, xóa sản phẩm khỏi giỏ
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      cart = await cart.populate('items.product');
      res.status(200).json({ message: 'Cập nhật số lượng sản phẩm thành công', cart });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật số lượng sản phẩm', error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng để xóa' });
    }

    await cart.save();
    cart = await cart.populate('items.product');
    res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng', error: error.message });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng để xóa' });
    }

    cart.items = [];
    await cart.save();
    res.status(200).json({ message: 'Giỏ hàng đã được xóa trống', cart });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa trống giỏ hàng', error: error.message });
  }
}; 