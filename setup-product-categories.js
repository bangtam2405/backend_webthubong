require('dotenv').config();
const mongoose = require('mongoose');
const ProductCategory = require('./models/ProductCategory');

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

async function setupProductCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    console.log('🗑️  Cleaning up old data...');
    await ProductCategory.deleteMany({});
    console.log('✅ Old data cleaned');

    console.log('📝 Creating default categories...');
    const categories = await ProductCategory.insertMany(defaultCategories);
    console.log(`✅ Created ${categories.length} categories:`);
    
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type})`);
    });

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: node server.js');
    console.log('2. Test the API: node test-api.js');
    console.log('3. Access admin panel: http://localhost:3000/admin/product-categories');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupProductCategories();