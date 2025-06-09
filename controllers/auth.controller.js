const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email đã được đăng ký" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Tạo tài khoản thành công", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không đúng" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai" });

    const token = jwt.sign({ userId: user._id }, "secret_key", { expiresIn: "7d" });

    res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
