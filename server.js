require('dotenv').config(); // Phải đặt trên cùng

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Cấu hình CORS chi tiết hơn
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connect error:', err);
  });
