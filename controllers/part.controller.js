const Part = require('../models/Part');

exports.getAllParts = async (req, res) => {
  try {
    const parts = await Part.find();
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy parts' });
  }
};
