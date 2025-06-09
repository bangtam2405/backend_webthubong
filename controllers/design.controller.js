// controllers/design.controller.js
const Design = require("../models/Design");

exports.createDesign = async (req, res) => {
  try {
    const designData = req.body;

    // Tạo mới design
    const newDesign = new Design(designData);
    await newDesign.save();

    res.status(201).json(newDesign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllDesigns = async (req, res) => {
  try {
    const designs = await Design.find();
    res.json(designs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
