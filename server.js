require('dotenv').config(); // Phải đặt trên cùng

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Cấu hình CORS chi tiết hơn
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL, // URL frontend từ environment variable
].filter(Boolean); // Loại bỏ giá trị undefined/null

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.) trong development
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Thêm headers cho static files
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   next();
// });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint - Render cần endpoint này để detect port
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    // Route auth
    const authRoutes = require("./routes/authRoutes");
    app.use("/api/auth", authRoutes);

    // // Route product
    // const productRoutes = require('./routes/productRoutes');
    // app.use('/api/products', productRoutes);
    // Route order
    const orderRoutes = require('./routes/orderRoutes');
    app.use('/api/orders', orderRoutes);

    // Route accessory
    const accessoryRoutes = require('./routes/accessory');
    app.use('/api/accessories', accessoryRoutes);

    // Route path
    const partRoutes = require('./routes/partRoutes');
    app.use('/api', partRoutes);

    // Route category
    const categoryRoutes = require("./routes/categoryRoutes"); // đúng path
    app.use('/api/categories', categoryRoutes);

    //Route design
    const designRoutes = require("./routes/designRoutes");
    app.use("/api/designs", designRoutes);

    //Route products 
    const productRoutes = require('./routes/productsRoutes');
    app.use('/api/products', productRoutes);

    // Route payment
    const paymentRoutes = require('./routes/paymentRoutes');
    app.use('/api/payment', paymentRoutes);

    // Route cart
    const cartRoutes = require('./routes/cartRoutes');
    app.use('/api/cart', cartRoutes);

    // Route reviews
    const reviewRoutes = require('./routes/reviewRoutes');
    app.use('/api/reviews', reviewRoutes);

    // Route wishlist
    const wishlistRoutes = require('./routes/wishlistRoutes');
    app.use('/api/wishlist', wishlistRoutes);

    // Route transactions
    const transactionRoutes = require('./routes/transactionRoutes');
    app.use('/api/transactions', transactionRoutes);

    // Route admin (thống kê)
    const adminRoutes = require('./routes/admin');
    app.use('/api/admin', adminRoutes);

    // Route giftbox
    const giftboxRoutes = require('./routes/giftboxRoutes');
    app.use('/api/giftboxes', giftboxRoutes);

    const aiChatRoute = require('./routes/aiChat');
    app.use('/api/ai-chat', aiChatRoute);

    // Route coupon
    const couponRoutes = require('./routes/couponRoutes');
    app.use('/api/coupons', couponRoutes);

    // Route banner
    const bannerRoutes = require('./routes/bannerRoutes');
    app.use('/api/banner', bannerRoutes);

    // Route product categories
    const productCategoryRoutes = require('./routes/productCategoryRoutes');
    app.use('/api/product-categories', productCategoryRoutes);

    // Route policies
    const policyRoutes = require('./routes/policyRoutes');
    app.use('/api/policies', policyRoutes);

    // Start server sau khi setup routes
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://0.0.0.0:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('MongoDB connect error:', err);
    // Vẫn start server ngay cả khi MongoDB connect fail
    // Để Render có thể detect port và show error rõ ràng hơn
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (MongoDB connection failed)`);
      console.error('⚠️ WARNING: Server started but MongoDB is not connected');
    });
  });
