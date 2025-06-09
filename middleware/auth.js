const jwt = require("jsonwebtoken")

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token không hợp lệ" })
  }

  const token = authHeader.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // gắn userId và role vào req
    next()
  } catch (err) {
    res.status(401).json({ msg: "Token không hợp lệ" })
  }
}

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Chỉ admin được phép" })
  }
  next()
}
