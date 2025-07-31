const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Coupon = require("../models/Coupon.js");
const { sendMail } = require("../mailer.js");

exports.register = async (req, res) => {
  const { username, email, password, fullName, phone, dob, gender, address } = req.body;
  if (!username) return res.status(400).json({ message: "Thiếu username" });
  if (!email) return res.status(400).json({ message: "Thiếu email" });
  if (!password) return res.status(400).json({ message: "Thiếu password" });
  try {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email đã được đăng ký" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "user",
      fullName: fullName || username,
      phone: phone || '',
      dob: dob ? new Date(dob) : undefined,
      gender: gender || 'other',
      addresses: address ? [{ label: 'Nhà riêng', address, isDefault: true }] : []
    });
    // Tạo mã giảm giá tự động cho user mới
    const code = `WELCOME${Math.floor(1000 + Math.random() * 9000)}`;
    const coupon = new Coupon({
      code,
      type: 'percentage',
      value: 10, // 10% giảm giá
      minOrderAmount: 0,
      usageLimit: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7*24*60*60*1000), // Hạn dùng 7 ngày
      isActive: true,
      userId: newUser._id,
    });
    await coupon.save();
    // Gửi email chào mừng kèm mã giảm giá
    const html = `<h2>Chào mừng bạn đến với Gấu Xinh!</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản. Dưới đây là mã giảm giá dành riêng cho bạn:</p>
      <div style="font-size:1.5em;font-weight:bold;color:#e3497a;margin:16px 0">${code}</div>
      <ul>
        <li>Giảm 10% cho đơn hàng đầu tiên</li>
        <li>Chỉ dùng 1 lần, hạn dùng 7 ngày</li>
      </ul>
      <p>Chúc bạn mua sắm vui vẻ tại Gấu Xinh!</p>`;
    try {
      await sendMail(email, "Chào mừng đến Gấu Xinh - Nhận mã giảm giá 10%", html);
    } catch (e) {
      console.error('Lỗi gửi email welcome coupon:', e.message);
    }
    res.status(201).json({ message: "Tạo tài khoản thành công", userId: newUser._id });
  } catch (err) {
    console.error('Lỗi đăng ký:', err.message, err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

//Cap nhat Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId, username, avatar, email, fullName, phone, dob, gender, address } = req.body;
    if (!userId || !username) return res.status(400).json({ success: false, error: "Thiếu userId hoặc username" });
    const updateFields = { username };
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (email !== undefined) updateFields.email = email;
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phone !== undefined) updateFields.phone = phone;
    if (dob !== undefined) updateFields.dob = dob;
    if (gender !== undefined) updateFields.gender = gender;
    if (address !== undefined) updateFields["addresses.0.address"] = address; // cập nhật địa chỉ mặc định
    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
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
    if (user.status === 'locked') return res.status(403).json({ message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai" });

    // Tạo access token (ngắn hạn)
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Tạo refresh token (dài hạn)
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    // Lưu refresh token vào user
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ message: "Đăng nhập thành công", accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// API refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: "Thiếu refresh token" });
  try {
    // Xác thực refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token không hợp lệ" });
    }
    // Tạo access token mới
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách hàng' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết khách hàng' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật khách hàng' });
  }
};

exports.updateUserNote = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { note: req.body.note }, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật ghi chú' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
};

exports.updateUserType = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { type: req.body.type }, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật phân loại' });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    user.addresses.push(req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm địa chỉ' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    const idx = user.addresses.findIndex(a => a._id.toString() === req.body._id);
    if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    user.addresses[idx] = req.body;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.body._id);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa địa chỉ' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa khách hàng' });
  }
};
