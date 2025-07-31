const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Lấy chi tiết đơn hàng theo id
router.get('/detail/:orderId', orderController.getOrderById);

// Lấy tất cả đơn hàng (admin)
router.get('/admin/all', orderController.getAllOrders);

// Cập nhật trạng thái đơn hàng (admin)
router.put('/admin/:orderId/status', orderController.updateOrderStatus);

// Khách hàng hủy đơn hàng
router.put('/:orderId/cancel', orderController.cancelOrder);

// Lấy đơn hàng theo userId (khách hàng)
router.get('/:userId', orderController.getOrdersByUser);

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Khách hàng cập nhật thông tin nhận hàng
router.put('/:orderId/update-info', orderController.updateOrderInfo);

// Xóa đơn hàng (admin)
router.delete('/admin/:orderId', orderController.deleteOrder);

module.exports = router;
