const express = require("express");
const router = express.Router();
const designController = require("../controllers/design.controller");

// Tạo mới thiết kế
router.post("/", designController.createDesign);

// Lấy danh sách thiết kế của user
router.get("/", designController.getDesignsByUser);

// Lấy 1 thiết kế theo id (chia sẻ)
router.get("/:id", designController.getDesignById);

// Update thiết kế (chia sẻ, chỉnh sửa)
router.put("/", designController.updateDesign);

router.delete("/:id", designController.deleteDesign);

module.exports = router;