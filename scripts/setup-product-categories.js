const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategory');
const Products = require('../models/Products');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/thubong', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Lỗi kết nối MongoDB:'));
db.once('open', async () => {
  console.log('✅ Đã kết nối MongoDB thành công!');
  
  try {
    // Đếm số sản phẩm theo từng loại trước
    console.log('📊 Đang đếm sản phẩm theo danh mục...');
    const teddyCount = await Products.countDocuments({ type: 'teddy' });
    const accessoryCount = await Products.countDocuments({ type: 'accessory' });
    const collectionCount = await Products.countDocuments({ type: 'collection' });
    const newCount = await Products.countDocuments({ type: 'new' });
    const giftboxCount = await Products.countDocuments({ type: 'giftbox' });
    
    console.log('📈 Thống kê sản phẩm hiện có:');
    console.log(`- Teddy: ${teddyCount} sản phẩm`);
    console.log(`- Phụ Kiện: ${accessoryCount} sản phẩm`);
    console.log(`- Bộ Sưu Tập: ${collectionCount} sản phẩm`);
    console.log(`- Hàng Mới: ${newCount} sản phẩm`);
    console.log(`- Hộp Quà: ${giftboxCount} sản phẩm`);

    // Xóa tất cả danh mục hiện có
    await ProductCategory.deleteMany({});
    console.log('🗑️ Đã xóa danh mục cũ');
    
    // Dữ liệu danh mục sản phẩm thật với số lượng chính xác
    const categories = [
      {
        name: "Teddy",
        type: "teddy",
        description: "Các mẫu thú bông teddy đáng yêu, phù hợp cho mọi lứa tuổi. Chất liệu mềm mại, an toàn cho trẻ em.",
        image: "/teddy-category.jpg",
        icon: "🐻",
        color: "#FF6B9D",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Bộ Sưu Tập",
        type: "collection",
        description: "Bộ sưu tập thú bông đặc biệt, độc đáo và có giá trị sưu tầm. Các mẫu giới hạn, độc quyền.",
        image: "/collection-category.jpg",
        icon: "🎨",
        color: "#4ECDC4",
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Phụ Kiện",
        type: "accessory",
        description: "Phụ kiện trang trí cho thú bông: nơ, kính, quần áo, mũ, giày... Tạo điểm nhấn cho thú bông của bạn.",
        image: "/accessory-category.jpg",
        icon: "🎀",
        color: "#45B7D1",
        isActive: true,
        sortOrder: 3
      },
      {
        name: "Hàng Mới",
        type: "new",
        description: "Sản phẩm mới nhất, hot nhất trong tháng. Cập nhật liên tục với xu hướng mới nhất.",
        image: "/new-category.jpg",
        icon: "⭐",
        color: "#96CEB4",
        isActive: true,
        sortOrder: 4
      },
      {
        name: "Hộp Quà",
        type: "giftbox",
        description: "Hộp quà đặc biệt, combo thú bông + phụ kiện. Hoàn hảo cho dịp sinh nhật, kỷ niệm.",
        image: "/giftbox-category.jpg",
        icon: "🎁",
        color: "#FFEAA7",
        isActive: true,
        sortOrder: 5
      }
    ];

    // Thêm danh mục vào database
    const createdCategories = await ProductCategory.insertMany(categories);
    console.log('✅ Đã thêm', createdCategories.length, 'danh mục sản phẩm');

    // Hiển thị thông tin chi tiết
    console.log('\n📋 Danh sách danh mục đã tạo:');
    for (const category of createdCategories) {
      console.log(`- ${category.icon} ${category.name} (${category.type})`);
    }

    // Đếm số sản phẩm theo từng danh mục sau khi tạo
    console.log('\n📊 Thống kê sản phẩm theo danh mục (sau khi tạo):');
    for (const category of createdCategories) {
      const productCount = await Products.countDocuments({ type: category.type });
      console.log(`- ${category.name}: ${productCount} sản phẩm`);
    }

    console.log('\n🎉 Hoàn thành setup danh mục sản phẩm!');
    console.log('💡 Bây giờ bạn có thể truy cập /admin/product-categories để quản lý danh mục');
    
  } catch (error) {
    console.error('❌ Lỗi khi setup danh mục sản phẩm:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
});