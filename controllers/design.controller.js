const Design = require("../models/Design");
const User = require("../models/User");
const Category = require("../models/Category");
const Accessory = require("../models/Accessory");
const ProductCategory = require("../models/ProductCategory");

// Tạo mới thiết kế
exports.createDesign = async (req, res) => {
  try {
    const { userId, designName, parts, canvasJSON, isPublic, previewImage, description } = req.body;
    // Đảm bảo parts.body là _id (string)
    const safeParts = { ...parts };
    const keys = ["body", "ears", "eyes", "nose", "mouth", "furColor", "material", "clothing", "size", "name"];
    keys.forEach(key => {
      // Nếu là object có _id thì lấy _id, nếu là string thì giữ nguyên, nếu null/undefined thì để rỗng
      if (safeParts[key] && typeof safeParts[key] === 'object' && safeParts[key]._id) {
        safeParts[key] = safeParts[key]._id;
      } else if (typeof safeParts[key] !== 'string') {
        safeParts[key] = safeParts[key] || "";
      }
    });
    // accessories là mảng _id
    if (Array.isArray(safeParts.accessories)) {
      safeParts.accessories = safeParts.accessories.map(item =>
        typeof item === 'object' && item !== null && item._id ? item._id : item
      );
    } else {
      safeParts.accessories = [];
    }
    // Không cho lưu nếu body rỗng
    if (!safeParts.body) {
      return res.status(400).json({ success: false, error: "Thiết kế phải có loại thân (body)!" });
    }
    // --- TÍNH GIÁ TỔNG ---
    let total = 0;
    // Tính giá các part chính
    for (const key of ["body", "ears", "eyes", "nose", "mouth", "furColor", "material", "clothing", "size"]) {
      const partId = safeParts[key];
      if (partId) {
        const cat = await Category.findById(partId);
        if (cat && typeof cat.price === 'number') total += cat.price;
      }
    }
    // Tính giá accessories
    if (Array.isArray(safeParts.accessories)) {
      for (const accId of safeParts.accessories) {
        if (accId) {
          const acc = await Accessory.findById(accId);
          if (acc && typeof acc.price === 'number') total += acc.price;
        }
      }
    }
    // --- END TÍNH GIÁ TỔNG ---
    const design = new Design({
      userId,
      designName,
      parts: safeParts,
      canvasJSON,
      isPublic: isPublic || false,
      previewImage: previewImage || "",
      description: description || "",
      price: total // Lưu giá tổng vào đây
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
    const { userId, isPublic } = req.query;
    let designs;
    if (isPublic === 'true' && userId === 'admin') {
      designs = await Design.find({ isPublic: true, userId: 'admin' }).sort({ updatedAt: -1 });
    } else if (isPublic === 'true') {
      designs = await Design.find({ isPublic: true }).sort({ updatedAt: -1 });
    } else if (userId) {
      designs = await Design.find({ userId }).sort({ updatedAt: -1 });
    } else {
      designs = [];
    }
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
    if (!design) return res.json(null);

    // Lấy thông tin user nếu có
    let user = null;
    if (design.userId) {
      user = await User.findOne({ _id: design.userId }, 'fullName avatar');
    }

    // Lấy thông tin chi tiết của các parts
    const allPartKeys = [
      "body", "ears", "eyes", "nose", "mouth", "furColor", "material", "clothing", "size", "name"
    ];
    
    const populatedParts = {};
    for (const key of allPartKeys) {
      const partId = design.parts?.[key];
      if (partId && partId !== "") {
        try {
          let category = null;
          
          // Ưu tiên tìm trong ProductCategory cho các trường liên quan đến màu sắc và vật liệu
          if (['furColor', 'material', 'clothing'].includes(key)) {
            category = await ProductCategory.findById(partId);
            if (category) {
              populatedParts[key] = {
                _id: category._id,
                name: category.name,
                color: category.color || "",
                price: category.price || 0,
                image: category.image || ""
              };
            }
          }
          
          // Nếu không tìm thấy trong ProductCategory hoặc không phải trường màu sắc, tìm trong Category
          if (!category) {
            category = await Category.findById(partId);
            if (category) {
              populatedParts[key] = {
                _id: category._id,
                name: category.name,
                color: "",
                price: category.price || 0,
                image: category.image || ""
              };
            }
          }
          
          // Nếu vẫn không tìm thấy, tìm trong ProductCategory
          if (!category) {
            category = await ProductCategory.findById(partId);
            if (category) {
              populatedParts[key] = {
                _id: category._id,
                name: category.name,
                color: category.color || "",
                price: category.price || 0,
                image: category.image || ""
              };
            }
          }
          
          // Nếu không tìm thấy ở đâu cả
          if (!category) {
            populatedParts[key] = { _id: partId, name: "Không xác định", color: "", price: 0, image: "" };
          }
        } catch (err) {
          populatedParts[key] = { _id: partId, name: "Không xác định", color: "", price: 0, image: "" };
        }
      } else {
        populatedParts[key] = null;
      }
    }

    // Lấy thông tin accessories
    if (Array.isArray(design.parts?.accessories) && design.parts.accessories.length > 0) {
      try {
        const accessories = await Accessory.find({ _id: { $in: design.parts.accessories } });
        populatedParts.accessories = accessories.map(acc => ({
          _id: acc._id,
          name: acc.name,
          color: acc.color || "",
          price: acc.price || 0
        }));
      } catch (err) {
        populatedParts.accessories = [];
      }
    } else {
      populatedParts.accessories = [];
    }

    // Trả về dữ liệu thiết kế kèm thông tin user và parts đã populate
    const designObj = design.toObject();
    designObj.user = user ? { fullName: user.fullName, avatar: user.avatar } : null;
    designObj.parts = populatedParts;
    
    // Thêm fabricColor từ parts.furColor nếu có
    if (populatedParts.furColor && populatedParts.furColor.color) {
      designObj.fabricColor = populatedParts.furColor.color;
    } else {
      designObj.fabricColor = "#000000"; // Màu mặc định
    }
    
    res.json(designObj);
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
    // Đảm bảo có thể update previewImage, description
    if (req.body.previewImage !== undefined) update.previewImage = req.body.previewImage;
    if (req.body.description !== undefined) update.description = req.body.description;
    await Design.findByIdAndUpdate(id, update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Clone thiết kế (tạo bản sao cho user khác)
exports.cloneDesign = async (req, res) => {
  try {
    const { id } = req.params; // id của thiết kế gốc
    const { userId } = req.body; // userId của người clone
    const original = await Design.findById(id);
    if (!original) return res.status(404).json({ success: false, error: 'Design not found' });
    // Tạo bản sao, gán userId mới, isPublic=false
    // Đảm bảo parts luôn đủ key
    const allPartKeys = [
      "body", "ears", "eyes", "nose", "mouth", "furColor", "material", "clothing", "size", "name", "accessories"
    ];
    const safeParts = {};
    for (const key of allPartKeys) {
      if (Array.isArray(original.parts?.[key])) {
        safeParts[key] = original.parts[key].filter(Boolean);
      } else {
        safeParts[key] = original.parts?.[key] || "";
      }
    }
    const clone = new Design({
      userId,
      designName: original.designName + ' (Copy)',
      parts: safeParts,
      canvasJSON: original.canvasJSON,
      isPublic: false,
      previewImage: original.previewImage,
      description: original.description,
    });
    await clone.save();
    res.json({ success: true, id: clone._id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Lấy danh sách thiết kế public (cộng đồng)
exports.getPublicDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ isPublic: true })
      .sort({ updatedAt: -1 });
      
    // Populate thông tin user cho từng design
    const designsWithUser = await Promise.all(designs.map(async (design) => {
      const designObject = design.toObject();
      
      // Lấy thông tin user từ User model
      if (designObject.userId) {
        const user = await User.findById(designObject.userId).select('fullName username avatar');
        designObject.user = user;
      } else {
        designObject.user = null;
      }
      
      delete designObject.userId;
      return designObject;
    }));

    res.json(designsWithUser);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Chia sẻ thiết kế (set isPublic=true)
exports.shareDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const design = await Design.findById(id);
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });
    if (design.userId !== userId) return res.status(403).json({ success: false, error: 'Not owner' });
    design.isPublic = true;
    await design.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};