const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const GEMINI_API_KEY = "AIzaSyCWK0yOFsA3o1lQAcZNehJCKh_Z9BsMl4M";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Import model Products
const Products = require('../models/Products');

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    // Xử lý intent đặc biệt: bán chạy nhất, đánh giá cao nhất
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('bán chạy nhất')) {
      // Lấy sản phẩm bán chạy nhất
      const best = await Products.findOne().sort({ sold: -1 }).limit(1);
      if (best) {
        return res.json({
          message: `Sản phẩm bán chạy nhất hiện tại là: <b>${best.name}</b>\n\n${best.description ? best.description.substring(0, 120) + (best.description.length > 120 ? '...' : '') : ''}\nGiá: ${best.price.toLocaleString('vi-VN')}₫\nĐã bán: ${best.sold || 0} lượt\n\n👉 <a href="/product/${best._id}">Xem chi tiết sản phẩm</a>`,
          product: {
            _id: best._id,
            name: best.name,
            image: best.image,
            price: best.price,
            sold: best.sold,
            rating: best.rating
          }
        });
      }
    }
    if (lowerMsg.includes('đánh giá cao nhất') || lowerMsg.includes('được đánh giá cao')) {
      // Lấy sản phẩm đánh giá cao nhất
      const top = await Products.findOne().sort({ rating: -1, reviews: -1 }).limit(1);
      if (top) {
        return res.json({
          message: `Sản phẩm được đánh giá cao nhất là: <b>${top.name}</b>\n\n${top.description ? top.description.substring(0, 120) + (top.description.length > 120 ? '...' : '') : ''}\nGiá: ${top.price.toLocaleString('vi-VN')}₫\nĐánh giá: ${top.rating || 0}⭐ (${top.reviews || 0} lượt)\n\n👉 <a href="/product/${top._id}">Xem chi tiết sản phẩm</a>`,
          product: {
            _id: top._id,
            name: top.name,
            image: top.image,
            price: top.price,
            sold: top.sold,
            rating: top.rating
          }
        });
      }
    }
    // Lấy top 10 sản phẩm bán chạy nhất
    const products = await Products.find().sort({ sold: -1 }).limit(10);
    // Tổng hợp thông tin sản phẩm
    const productInfo = products.map(p =>
      `- ${p.name}: ${p.description ? p.description.substring(0, 60) + (p.description.length > 60 ? '...' : '') : ""} Giá: ${p.price}đ. Đã bán: ${p.sold || 0} lượt. Đánh giá: ${p.rating || "chưa có"}`
    ).join('\n');
    // Đọc thêm thông tin website cố định
    const infoPath = path.join(__dirname, '../../lib/website_info.txt');
    const websiteInfo = fs.readFileSync(infoPath, 'utf-8');
    // Tạo prompt
    const prompt = `\nBạn là trợ lý AI của website thú bông. Dưới đây là thông tin về website:\n${websiteInfo}\n\nDưới đây là danh sách sản phẩm nổi bật:\n${productInfo}\n\nNgười dùng hỏi: "${message}"\nHãy trả lời ngắn gọn, chính xác, thân thiện, dựa trên thông tin website và sản phẩm ở trên.`;
    // Gọi Gemini API
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY
        }
      }
    );
    const aiMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi chưa có thông tin về câu hỏi này.";
    res.json({ message: aiMessage });
  } catch (error) {
    console.error(error?.response?.data || error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi gọi AI." });
  }
});

module.exports = router; 