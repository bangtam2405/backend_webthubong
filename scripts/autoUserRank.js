// Script: Tự động nâng hạng user dựa trên tổng chi tiêu và số đơn hàng
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/website_thubong';

async function autoUserRank() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find();
  let updated = 0;
  for (const user of users) {
    // Lấy tất cả đơn hàng đã giao của user
    const orders = await Order.find({ user: user._id, status: 'Đã giao hàng' });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    let newType = 'new';
    if (totalSpent >= 10000000 || totalOrders >= 20) {
      newType = 'vip';
    } else if (totalSpent >= 2000000 || totalOrders >= 5) {
      newType = 'regular';
    }
    if (user.type !== newType) {
      user.type = newType;
      await user.save();
      updated++;
      console.log(`User ${user.email || user.username}: ${totalOrders} orders, ${totalSpent}đ => ${newType}`);
    }
  }
  console.log(`\nĐã cập nhật ${updated} user.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  autoUserRank().catch(e => { console.error(e); process.exit(1); });
} 