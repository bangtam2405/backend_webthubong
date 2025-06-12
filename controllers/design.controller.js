const Design = require("../models/Design");

// Tạo mới thiết kế
exports.createDesign = async (req, res) => {
  try {
    const { userId, designName, parts, canvasJSON, isPublic } = req.body;
    const design = new Design({
      userId,
      designName,
      parts,
      canvasJSON,
      isPublic: isPublic || false,
    });
    await design.save();
    res.json({ success: true, id: design._id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Lấy danh sách thiết kế của user
exports.getDesignsByUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const designs = await Design.find({ userId }).sort({ updatedAt: -1 });
    res.json(designs);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Lấy 1 thiết kế theo id (dùng cho chia sẻ)
exports.getDesignById = async (req, res) => {
  try {
    const { id } = req.params;
    const design = await Design.findById(id);
    res.json(design);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Xóa thiết kế
exports.deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;
    await Design.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update thiết kế (chia sẻ, chỉnh sửa)
exports.updateDesign = async (req, res) => {
  try {
    const { id, ...update } = req.body;
    update.updatedAt = new Date();
    await Design.findByIdAndUpdate(id, update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};