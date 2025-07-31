const Review = require('../models/Review');
const Product = require('../models/Products'); // Để cập nhật rating/reviews trong Product

// Thêm đánh giá mới cho sản phẩm
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment, media, orderItem } = req.body;
    const userId = req.user.userId; // Lấy userId từ auth middleware
    // Thêm log chi tiết để debug lỗi 500
    console.log('==> Nhận request review:', { productId, rating, comment, media, orderItem, userId });

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này trong order item này chưa
    const existingReview = await Review.findOne({ product: productId, user: userId, orderItem });
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này trong đơn này rồi.' });
    }

    if (!orderItem) {
      return res.status(400).json({ message: 'Thiếu orderItem (sản phẩm trong đơn hàng)!' });
    }
    const newReview = new Review({
      product: productId,
      user: userId,
      rating,
      comment,
      media: Array.isArray(media) ? media : [],
      orderItem,
    });

    await newReview.save();

    // Cập nhật rating và reviews trong Product model
    const product = await Product.findById(productId);
    if (product) {
      const allReviews = await Review.find({ product: productId });
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      product.rating = totalRating / allReviews.length;
      product.reviews = allReviews.length;
      await product.save();
    }

    res.status(201).json({ message: 'Đánh giá của bạn đã được gửi thành công.', review: newReview });
  } catch (error) {
    // Thêm log lỗi chi tiết
    console.error('Lỗi khi gửi đánh giá:', error);
    res.status(500).json({ message: 'Lỗi khi gửi đánh giá', error: error.message });
  }
};

// Lấy tất cả đánh giá cho một sản phẩm
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate('user', 'username email fullName avatar').sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá sản phẩm', error: error.message });
  }
};

// Lấy tất cả đánh giá của một người dùng
exports.getReviewsByUser = async (req, res) => {
  try {
    const userId = req.user.userId; // Lấy userId từ auth middleware
    const reviews = await Review.find({ user: userId }).populate('product', 'name image').populate('user', 'username email fullName avatar').sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá của người dùng', error: error.message });
  }
};

// Lấy tất cả review, có thể filter rating, limit
exports.getAllReviews = async (req, res) => {
  try {
    const { rating, limit } = req.query;
    const filter = {};
    if (rating) filter.rating = Number(rating);
    const query = Review.find(filter).populate('user', 'username email fullName avatar').sort({ createdAt: -1 });
    if (limit) query.limit(Number(limit));
    const reviews = await query.exec();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá', error: error.message });
  }
}; 