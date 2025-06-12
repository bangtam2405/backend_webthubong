const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email đã được đăng ký" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword, role: "user" });

    res.status(201).json({ message: "Tạo tài khoản thành công", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

//Cap nhat Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) return res.status(400).json({ success: false, error: "Thiếu userId hoặc username" });
    const user = await User.findByIdAndUpdate(userId, { username }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: "Không tìm thấy user" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user) return res.status(404).json({ success: false });
  res.json({ success: true, user });
};
// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ success: false, error: "Thiếu userId hoặc mật khẩu mới" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "Không tìm thấy user" });
    user.password = newPassword; // Nếu bạn dùng bcrypt, nhớ hash lại ở đây!
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không đúng" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET, // ✅ dùng đúng biến môi trường
      { expiresIn: "7d" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
