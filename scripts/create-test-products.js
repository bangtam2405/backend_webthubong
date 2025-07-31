const mongoose = require('mongoose');
const Product = require('../models/Products');

async function createTestProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thubongxinh');
    console.log('Connected to database');
    
    // Tạo một số sản phẩm test
    const testProducts = [
      {
        name: 'Gấu Bông Teddy Áo Len Kẻ Sọc',
        description: 'Chào đón thành viên mới vào bộ sưu tập của bạn – chú gấu bông Teddy mặc áo len kẻ sọc cực kỳ đáng yêu! Với bộ lông màu nâu be ấm áp, đôi mắt tròn xoe và nụ cười hiền lành, chú gấu này sẽ mang đến sự ấm áp và niềm vui cho bất kỳ ai. Đặc biệt, chiếc áo len kẻ sọc đỏ trắng vừa vặn, với một chú gấu nhỏ xinh đính trên ngực áo, tạo nên một phong cách cổ điển và vô cùng dễ thương.',
        price: 160000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        type: 'teddy',
        stock: 50,
        sold: 0,
        rating: 4.5,
        reviews: 12
      },
      {
        name: 'Gấu Bông Teddy Áo Thun',
        description: 'Mang đến sự ngọt ngào và ấm áp cho không gian của bạn với gấu bông Teddy mặc áo thun "Teddy Bear" cực kỳ dễ thương này! Chú gấu khoác lên mình chiếc áo thun đỏ nổi bật với họa tiết gấu nâu "Teddy Bear" tinh nghịch. Đây sẽ là món quà ý nghĩa cho các cặp đôi, bạn thân, hoặc đơn giản là để tô điểm cho căn phòng của bạn.',
        price: 180000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        type: 'teddy',
        stock: 30,
        sold: 0,
        rating: 4.8,
        reviews: 8
      }
    ];
    
    for (const productData of testProducts) {
      const product = new Product(productData);
      await product.save();
      console.log('Created product:', product.name, 'ID:', product._id);
    }
    
    // Kiểm tra lại
    const products = await Product.find();
    console.log('Total products in database:', products.length);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createTestProducts(); 