const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Products');

exports.getStats = async (req, res) => {
    try {
        const { from, to } = req.query;

        // --- Date Filter Setup ---
        let dateFilter = {};
        const hasDateFilter = from || to;
        if (from) dateFilter.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Include the whole "to" day
            dateFilter.$lte = toDate;
        }

        // --- Match Conditions ---
        // For revenue (only completed orders)
        const completedOrderMatch = { status: 'Đã giao hàng' };
        if (hasDateFilter) completedOrderMatch.createdAt = dateFilter;

        // For all orders (any status)
        const allOrdersMatch = {};
        if (hasDateFilter) allOrdersMatch.createdAt = dateFilter;

        // --- Calculations ---

        // 1. Total Revenue (from completed orders in range)
        const revenueData = await Order.aggregate([
            { $match: completedOrderMatch },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // 2. Total Orders (all orders in range)
        const totalOrders = await Order.countDocuments(allOrdersMatch);

        // 3. Total Customers
        // If filtered: unique customers who placed an order.
        // If not filtered: total registered users.
        let totalCustomers;
        if (hasDateFilter) {
            const distinctUsers = await Order.distinct('user', allOrdersMatch);
            totalCustomers = distinctUsers.length;
        } else {
            totalCustomers = await User.countDocuments();
        }

        // 4. Total Products (always the total count, not affected by date)
        const totalProducts = await Product.countDocuments();

        // 5. Revenue Grouping (day/month/year)
        const groupBy = req.query.groupBy || 'month';
        let groupId, nameExpr, sortExpr;
        if (groupBy === 'day') {
            groupId = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            nameExpr = { $concat: [
                'Ngày ', { $toString: { $dayOfMonth: '$createdAt' } },
                '/', { $toString: { $month: '$createdAt' } },
                '/', { $toString: { $year: '$createdAt' } }
            ] };
            sortExpr = { 'year': 1, 'month': 1, 'day': 1 };
        } else if (groupBy === 'year') {
            groupId = { year: { $year: '$createdAt' } };
            nameExpr = { $concat: [ 'Năm ', { $toString: { $year: '$createdAt' } } ] };
            sortExpr = { 'year': 1 };
        } else { // month
            groupId = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
            nameExpr = { $concat: [
                'Thg ', { $toString: { $month: '$createdAt' } },
                '/', { $toString: { $year: '$createdAt' } }
            ] };
            sortExpr = { 'year': 1, 'month': 1 };
        }
        const monthlyRevenueAgg = await Order.aggregate([
            { $match: completedOrderMatch }, // Changed from monthlyRevenueMatch to completedOrderMatch
            { $unwind: "$products" },
            {
                $group: {
                    _id: groupId,
                    total: { $sum: '$totalPrice' },
                    orderSet: { $addToSet: '$_id' },
                    customerSet: { $addToSet: '$user' },
                    totalProductSold: { $sum: '$products.quantity' },
                    createdAt: { $first: '$createdAt' }
                }
            },
            {
                $project: {
                    _id: 1,
                    total: 1,
                    orderCount: { $size: '$orderSet' },
                    customerCount: { $size: '$customerSet' },
                    totalProductSold: 1,
                    createdAt: 1,
                    name: nameExpr,
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day'
                }
            },
            { $sort: sortExpr }
        ]);
        const monthlyRevenue = monthlyRevenueAgg;
        // console.log('monthlyRevenue:', monthlyRevenue); // Đã tắt log để không in ra terminal

        // 6. Recent Orders (from all orders in range)
        const recentOrders = await Order.find(allOrdersMatch)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'username email');

        // --- Response ---
        res.status(200).json({
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            monthlyRevenue,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê', error: error.message });
    }
};

exports.getTopProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const products = await Product.find()
      .sort({ sold: -1 })
      .limit(limit)
      .select('name sold image price _id');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy top sản phẩm bán chạy', error: err.message });
  }
}; 