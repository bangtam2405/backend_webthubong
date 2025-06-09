const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền admin' });
  }
  next();
};

module.exports = checkAdmin;
