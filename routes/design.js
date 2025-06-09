// routes/design.js
const express = require("express");
const router = express.Router();
const designController = require("../controllers/design.controller");

router.post("/", designController.createDesign);   // Tạo thiết kế mới
router.get("/", designController.getAllDesigns);    // Lấy tất cả thiết kế

module.exports = router;
