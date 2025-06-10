const express = require('express');
const router = express.Router();
const { addPart, getAllParts } = require('../controllers/part.controller');
const verifyToken = require('../middleware/verifyToken');
const checkAdmin = require('../middleware/checkAdmin');

router.post('/admin/part', verifyToken, checkAdmin, addPart);
router.get('/parts', getAllParts); // <- lấy danh sách tất cả parts

module.exports = router;
