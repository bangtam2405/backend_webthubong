require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      console.log('✅ Server started successfully!');
    });
  })
  .catch(err => {
    console.error('MongoDB connect error:', err);
  });