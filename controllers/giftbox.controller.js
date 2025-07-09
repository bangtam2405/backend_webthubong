const GiftBox = require('../models/GiftBox');

// Lấy tất cả hộp quà
exports.getAllGiftBoxes = async (req, res) => {
  try {
    const giftBoxes = await GiftBox.find();
    res.json(giftBoxes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy hộp quà theo id
exports.getGiftBoxById = async (req, res) => {
  try {
    const giftBox = await GiftBox.findById(req.params.id);
    if (!giftBox) return res.status(404).json({ error: 'Gift box not found' });
    res.json(giftBox);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm hộp quà mới
exports.createGiftBox = async (req, res) => {
  try {
    const { name, image, price, quantity, description } = req.body;
    const giftBox = new GiftBox({ name, image, price, quantity, description });
    await giftBox.save();
    res.status(201).json(giftBox);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Sửa hộp quà
exports.updateGiftBox = async (req, res) => {
  try {
    const { name, image, price, quantity, description } = req.body;
    const giftBox = await GiftBox.findByIdAndUpdate(
      req.params.id,
      { name, image, price, quantity, description },
      { new: true }
    );
    if (!giftBox) return res.status(404).json({ error: 'Gift box not found' });
    res.json(giftBox);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa hộp quà
exports.deleteGiftBox = async (req, res) => {
  try {
    const giftBox = await GiftBox.findByIdAndDelete(req.params.id);
    if (!giftBox) return res.status(404).json({ error: 'Gift box not found' });
    res.json({ message: 'Gift box deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 