const express = require("express")
const router = express.Router()
const { authMiddleware, adminOnly } = require("../middleware/auth")

router.get("/products", authMiddleware, adminOnly, (req, res) => {
  // Chỉ admin mới truy cập được
  res.json({ msg: "Danh sách sản phẩm cho admin" })
})

module.exports = router
