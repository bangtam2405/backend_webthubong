const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { auth, adminOnly } = require('../middleware/auth'); // Giả định middleware xác thực và phân quyền của bạn

// Lấy tất cả các giao dịch (chỉ admin hoặc người dùng của giao dịch đó)
router.get('/', auth, transactionController.getAllTransactions);

// Lấy một giao dịch theo ID (chỉ admin hoặc chủ sở hữu)
router.get('/:id', auth, transactionController.getTransactionById);

// Ghi chú: Các hàm createTransaction và updateTransactionStatus trong controller thường được gọi nội bộ
// từ các controller khác (ví dụ: payment.controller) chứ không phải là endpoint API trực tiếp.
// Nếu bạn muốn endpoint cho admin để tạo/cập nhật thủ công, có thể thêm vào đây.

module.exports = router; 