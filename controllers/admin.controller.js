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

        // 5. Monthly Revenue (for chart)
        let monthlyRevenueMatch = { ...completedOrderMatch }; // Use the same logic as revenue
        if (!hasDateFilter) {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            monthlyRevenueMatch.createdAt = { $gte: twelveMonthsAgo };
        }
        
        const monthlyRevenue = await Order.aggregate([
            { $match: monthlyRevenueMatch },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    total: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

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