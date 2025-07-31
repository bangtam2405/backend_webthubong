const mongoose = require('mongoose');
const Design = require('../models/Design');

async function fixDesignParts() {
  await mongoose.connect('mongodb://localhost:27017/thubongxinh'); // Sửa lại nếu DB khác

  const allDesigns = await Design.find();
  for (const design of allDesigns) {
    const keys = ["body", "ears", "eyes", "nose", "mouth", "furColor", "material", "clothing", "size", "name"];
    let changed = false;
    for (const key of keys) {
      if (design.parts[key] === undefined) {
        design.parts[key] = "";
        changed = true;
      }
    }
    if (!Array.isArray(design.parts.accessories)) {
      design.parts.accessories = [];
      changed = true;
    }
    if (changed) {
      await design.save();
      console.log('Đã cập nhật:', design._id);
    }
  }
  mongoose.disconnect();
}
fixDesignParts(); 