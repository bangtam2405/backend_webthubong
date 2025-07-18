require('dotenv').config(); // Phải đặt trên cùng

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    // Route auth
    app.use('/api/auth', require('./routes/auth'));

    // Route product
    const productRoutes = require('./routes/productRoutes');
    app.use('/api/products', productRoutes);
    // Route order
    const orderRoutes = require('./routes/orderRoutes');
    app.use('/api/orders', orderRoutes);

    // Route accessory
    const accessoryRoutes = require('./routes/accessory');
    app.use('/api/accessories', accessoryRoutes);

    // Route path
    const partRoutes = require('./routes/partRoutes');
    app.use('/api/parts', partRoutes);


    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connect error:', err);
  });
