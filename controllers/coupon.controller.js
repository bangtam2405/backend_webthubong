const Coupon = require('../models/Coupon');

// Tạo mã giảm giá mới (chỉ admin)
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscountAmount, usageLimit, validUntil, isActive } = req.body;

    const newCoupon = new Coupon({
      code,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      validUntil,
      isActive,
    });

    await newCoupon.save();
    res.status(201).json({ message: 'Mã giảm giá đã được tạo thành công', coupon: newCoupon });
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo mã giảm giá', error: error.message });
  }
};

// Lấy tất cả mã giảm giá (chỉ admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách mã giảm giá', error: error.message });
  }
};

// Lấy mã giảm giá theo code
exports.getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy mã giảm giá', error: error.message });
  }
};

// Cập nhật mã giảm giá (chỉ admin)
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá để cập nhật.' });
    }
    res.status(200).json({ message: 'Mã giảm giá đã được cập nhật', coupon: updatedCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật mã giảm giá', error: error.message });
  }
};

// Xóa mã giảm giá (chỉ admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá để xóa.' });
    }
    res.status(200).json({ message: 'Mã giảm giá đã được xóa thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa mã giảm giá', error: error.message });
  }
};

// Áp dụng mã giảm giá (có thể dùng cho người dùng)
exports.applyCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Mã giảm giá không hoạt động.' });
    }

    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn.' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng.' });
    }

    if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Đơn hàng tối thiểu để áp dụng mã này là ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫.` });
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (totalAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    }

    res.status(200).json({ message: 'Mã giảm giá đã được áp dụng.', discountAmount, couponId: coupon._id });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi áp dụng mã giảm giá', error: error.message });
  }
}; 