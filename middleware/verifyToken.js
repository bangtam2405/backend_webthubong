const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // dùng biến môi trường
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = verifyToken;
