const Wishlist = require('../models/Wishlist');

// Lấy danh sách yêu thích của người dùng
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId; // userId từ middleware auth
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate('products')
      .populate('designs');
    
    if (!wishlist) {
      return res.status(200).json({ products: [], designs: [] }); // Trả về danh sách rỗng nếu chưa có
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích', error: error.message });
  }
};

// Thêm/xóa sản phẩm/design vào/khỏi danh sách yêu thích
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, type = 'product', action = 'add' } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Nếu chưa có wishlist và action là add, tạo mới
      if (action === 'add') {
        wishlist = new Wishlist({ user: userId, products: [], designs: [] });
      } else {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy danh sách yêu thích.' 
        });
      }
    }

    if (type === 'design') {
      if (action === 'add') {
        // Thêm design vào wishlist
        if (!wishlist.designs.includes(productId)) {
          wishlist.designs.push(productId);
        }
      } else {
        // Xóa design khỏi wishlist
        wishlist.designs = wishlist.designs.filter(id => id.toString() !== productId);
      }
    } else {
      if (action === 'add') {
        // Thêm product vào wishlist
        if (!wishlist.products.includes(productId)) {
          wishlist.products.push(productId);
        }
      } else {
        // Xóa product khỏi wishlist
        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      }
    }

    await wishlist.save();
    
    // Populate cả products và designs
    wishlist = await wishlist.populate('products');
    wishlist = await wishlist.populate('designs');
    
    res.status(200).json({ 
      success: true,
      message: action === 'add' 
        ? `${type === 'design' ? 'Thiết kế' : 'Sản phẩm'} đã được thêm vào danh sách yêu thích`
        : `${type === 'design' ? 'Thiết kế' : 'Sản phẩm'} đã được xóa khỏi danh sách yêu thích`, 
      wishlist 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi thao tác với danh sách yêu thích', 
      error: error.message 
    });
  }
};

// Xóa sản phẩm/design khỏi danh sách yêu thích
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, type = 'product' } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy danh sách yêu thích.' 
      });
    }

    let removed = false;
    if (type === 'design') {
      // Xóa design khỏi wishlist
      const initialLength = wishlist.designs.length;
      wishlist.designs = wishlist.designs.filter(id => id.toString() !== productId);
      removed = wishlist.designs.length !== initialLength;
    } else {
      // Xóa product khỏi wishlist
      const initialLength = wishlist.products.length;
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      removed = wishlist.products.length !== initialLength;
    }

    if (!removed) {
      return res.status(404).json({ 
        success: false,
        message: `Không tìm thấy ${type === 'design' ? 'thiết kế' : 'sản phẩm'} trong danh sách yêu thích để xóa.` 
      });
    }

    await wishlist.save();
    
    // Populate cả products và designs
    wishlist = await wishlist.populate('products');
    wishlist = await wishlist.populate('designs');
    
    res.status(200).json({ 
      success: true,
      message: `${type === 'design' ? 'Thiết kế' : 'Sản phẩm'} đã được xóa khỏi danh sách yêu thích`, 
      wishlist 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa khỏi danh sách yêu thích', 
      error: error.message 
    });
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