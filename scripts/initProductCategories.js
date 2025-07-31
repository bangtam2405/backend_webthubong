require('dotenv').config();
const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategory');

const defaultCategories = [
  {
    name: "Teddy",
    type: "teddy",
    description: "Các mẫu thú bông teddy đáng yêu, phù hợp cho mọi lứa tuổi",
    icon: "🐻",
    color: "#FF6B9D",
    isActive: true,
    sortOrder: 1
  },
  {
    name: "Bộ Sưu Tập",
    type: "collection",
    description: "Bộ sưu tập thú bông đặc biệt, độc đáo và có giá trị sưu tầm",
    icon: "🎨",
    color: "#4ECDC4",
    isActive: true,
    sortOrder: 2
  },
  {
    name: "Phụ Kiện",
    type: "accessory",
    description: "Phụ kiện trang trí cho thú bông: nơ, kính, quần áo...",
    icon: "🎀",
    color: "#45B7D1",
    isActive: true,
    sortOrder: 3
  },
  {
    name: "Hàng Mới",
    type: "new",
    description: "Sản phẩm mới nhất, hot nhất trong tháng",
    icon: "⭐",
    color: "#96CEB4",
    isActive: true,
    sortOrder: 4
  },
  {
    name: "Hộp Quà",
    type: "giftbox",
    description: "Hộp quà đặc biệt, combo thú bông + phụ kiện",
    icon: "🎁",
    color: "#FFEAA7",
    isActive: true,
    sortOrder: 5
  }
];

async function initProductCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Đã kết nối MongoDB');

    // Xóa tất cả danh mục cũ (nếu có)
    await ProductCategory.deleteMany({});
    console.log('Đã xóa danh mục cũ');

    // Thêm danh mục mới
    const categories = await ProductCategory.insertMany(defaultCategories);
    console.log(`Đã tạo ${categories.length} danh mục sản phẩm:`);
    
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.type})`);
    });

    console.log('Khởi tạo danh mục sản phẩm thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khởi tạo danh mục sản phẩm:', error);
    process.exit(1);
  }
}

initProductCategories();