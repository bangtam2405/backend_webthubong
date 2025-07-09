const Wishlist = require('../models/Wishlist');

// Lấy danh sách yêu thích của người dùng
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId; // userId từ middleware auth
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    if (!wishlist) {
      return res.status(200).json({ products: [] }); // Trả về danh sách rỗng nếu chưa có
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích', error: error.message });
  }
};

// Thêm sản phẩm vào danh sách yêu thích
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Nếu chưa có wishlist, tạo mới
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    wishlist = await wishlist.populate('products');
    res.status(200).json({ message: 'Sản phẩm đã được thêm vào danh sách yêu thích', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào danh sách yêu thích', error: error.message });
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Không tìm thấy danh sách yêu thích.' });
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong danh sách yêu thích để xóa.' });
    }

    await wishlist.save();
    wishlist = await wishlist.populate('products');
    res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi danh sách yêu thích', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi danh sách yêu thích', error: error.message });
  }
};

// Lấy danh sách yêu thích của người dùng theo ID (cho admin)
exports.getWishlistByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    if (!wishlist) {
      return res.status(200).json({ products: [] }); // Trả về danh sách rỗng nếu chưa có
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích', error: error.message });
  }
}; 