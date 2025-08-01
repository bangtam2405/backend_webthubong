const ShippingZone = require('../models/ShippingZone');
const ReturnPolicy = require('../models/ReturnPolicy');
const WarrantyPolicy = require('../models/WarrantyPolicy');

// Shipping Zone Controllers
exports.getAllShippingZones = async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({ createdAt: -1 });
    res.json({ zones });
  } catch (error) {
    console.error('Lỗi lấy shipping zones:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createShippingZone = async (req, res) => {
  try {
    const { name, provinces, wards, baseFee, freeThreshold, description } = req.body;
    
    if (!name || !provinces || !wards || baseFee === undefined || freeThreshold === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const zone = new ShippingZone({
      name,
      provinces: Array.isArray(provinces) ? provinces : [provinces],
      wards: Array.isArray(wards) ? wards : [wards],
      baseFee: Number(baseFee),
      freeThreshold: Number(freeThreshold),
      description
    });

    const savedZone = await zone.save();
    res.status(201).json({ zone: savedZone, message: 'Tạo khu vực vận chuyển thành công' });
  } catch (error) {
    console.error('Lỗi tạo shipping zone:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateShippingZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, provinces, wards, baseFee, freeThreshold, description } = req.body;

    const zone = await ShippingZone.findByIdAndUpdate(
      id,
      {
        name,
        provinces: Array.isArray(provinces) ? provinces : [provinces],
        wards: Array.isArray(wards) ? wards : [wards],
        baseFee: Number(baseFee),
        freeThreshold: Number(freeThreshold),
        description
      },
      { new: true }
    );

    if (!zone) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực vận chuyển' });
    }

    res.json({ zone, message: 'Cập nhật khu vực vận chuyển thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật shipping zone:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteShippingZone = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await ShippingZone.findByIdAndDelete(id);

    if (!zone) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực vận chuyển' });
    }

    res.json({ message: 'Xóa khu vực vận chuyển thành công' });
  } catch (error) {
    console.error('Lỗi xóa shipping zone:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Return Policy Controllers
exports.getAllReturnPolicies = async (req, res) => {
  try {
    const policies = await ReturnPolicy.find().sort({ createdAt: -1 });
    res.json({ policies });
  } catch (error) {
    console.error('Lỗi lấy return policies:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createReturnPolicy = async (req, res) => {
  try {
    const { title, content, isActive } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const policy = new ReturnPolicy({
      title,
      content,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedPolicy = await policy.save();
    res.status(201).json({ policy: savedPolicy, message: 'Tạo chính sách đổi trả thành công' });
  } catch (error) {
    console.error('Lỗi tạo return policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateReturnPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;

    const policy = await ReturnPolicy.findByIdAndUpdate(
      id,
      { title, content, isActive },
      { new: true }
    );

    if (!policy) {
      return res.status(404).json({ message: 'Không tìm thấy chính sách đổi trả' });
    }

    res.json({ policy, message: 'Cập nhật chính sách đổi trả thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật return policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteReturnPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await ReturnPolicy.findByIdAndDelete(id);

    if (!policy) {
      return res.status(404).json({ message: 'Không tìm thấy chính sách đổi trả' });
    }

    res.json({ message: 'Xóa chính sách đổi trả thành công' });
  } catch (error) {
    console.error('Lỗi xóa return policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Warranty Policy Controllers
exports.getAllWarrantyPolicies = async (req, res) => {
  try {
    const policies = await WarrantyPolicy.find().sort({ createdAt: -1 });
    res.json({ policies });
  } catch (error) {
    console.error('Lỗi lấy warranty policies:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.createWarrantyPolicy = async (req, res) => {
  try {
    const { title, content, duration, isActive } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const policy = new WarrantyPolicy({
      title,
      content,
      duration: duration || 30,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedPolicy = await policy.save();
    res.status(201).json({ policy: savedPolicy, message: 'Tạo chính sách bảo hành thành công' });
  } catch (error) {
    console.error('Lỗi tạo warranty policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateWarrantyPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, duration, isActive } = req.body;

    const policy = await WarrantyPolicy.findByIdAndUpdate(
      id,
      { title, content, duration, isActive },
      { new: true }
    );

    if (!policy) {
      return res.status(404).json({ message: 'Không tìm thấy chính sách bảo hành' });
    }

    res.json({ policy, message: 'Cập nhật chính sách bảo hành thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật warranty policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteWarrantyPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await WarrantyPolicy.findByIdAndDelete(id);

    if (!policy) {
      return res.status(404).json({ message: 'Không tìm thấy chính sách bảo hành' });
    }

    res.json({ message: 'Xóa chính sách bảo hành thành công' });
  } catch (error) {
    console.error('Lỗi xóa warranty policy:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 