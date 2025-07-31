const express = require("express");
const router = express.Router();
const designController = require("../controllers/design.controller");

// Tạo mới thiết kế
router.post("/", designController.createDesign);

// Lấy danh sách thiết kế của user
router.get("/", designController.getDesignsByUser);

// Lấy danh sách thiết kế public (cộng đồng)
router.get('/public', designController.getPublicDesigns);

// Lấy 1 thiết kế theo id (chia sẻ)
router.get("/:id", designController.getDesignById);

// Update thiết kế (chia sẻ, chỉnh sửa)
router.put("/", designController.updateDesign);

// Clone thiết kế (tạo bản sao cho user khác)
router.post('/:id/clone', designController.cloneDesign);

// Chia sẻ thiết kế (set isPublic=true)
router.put('/:id/share', designController.shareDesign);

router.delete("/:id", designController.deleteDesign);

module.exports = router;