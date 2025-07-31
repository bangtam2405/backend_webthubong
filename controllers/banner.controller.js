const Banner = require('../models/Banner');

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách banner', error: err.message });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy banner', error: err.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi tạo banner', error: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json(banner);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật banner', error: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi xóa banner', error: err.message });
  }
}; 