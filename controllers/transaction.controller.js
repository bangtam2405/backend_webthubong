const Transaction = require('../models/Transaction');

// Tạo một bản ghi giao dịch mới (được gọi nội bộ khi thanh toán được khởi tạo)
exports.createTransaction = async (data) => {
  try {
    const newTransaction = new Transaction(data);
    await newTransaction.save();
    return newTransaction;
  } catch (error) {
    console.error('Lỗi khi tạo bản ghi giao dịch:', error);
    throw new Error('Không thể tạo bản ghi giao dịch');
  }
};

// Cập nhật trạng thái giao dịch
exports.updateTransactionStatus = async (transactionId, status, responseData = {}) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Không tìm thấy giao dịch để cập nhật');
    }

    transaction.status = status;
    transaction.responseCode = responseData.responseCode || transaction.responseCode;
    transaction.message = responseData.message || transaction.message;
    transaction.rawResponse = responseData.rawResponse || transaction.rawResponse;
    
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
    throw new Error('Không thể cập nhật trạng thái giao dịch');
  }
};

// Lấy tất cả các giao dịch (chỉ admin hoặc người dùng của giao dịch đó)
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.userId; // Lấy userId từ auth middleware
    const userRole = req.user.role; // Lấy role từ auth middleware

    let query = {};
    if (userRole !== 'admin') {
      query.user = userId; // Nếu không phải admin, chỉ lấy giao dịch của chính họ
    }

    const transactions = await Transaction.find(query)
      .populate('order')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách giao dịch', error: error.message });
  }
};

// Lấy một giao dịch theo ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const transaction = await Transaction.findById(id)
      .populate('order')
      .populate('user', 'username email');

    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch.' });
    }

    // Đảm bảo chỉ admin hoặc chủ sở hữu giao dịch mới có thể xem
    if (userRole !== 'admin' && transaction.user.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập giao dịch này.' });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy giao dịch', error: error.message });
  }
}; 