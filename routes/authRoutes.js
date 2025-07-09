const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authController = require("../controllers/auth.controller");
const { auth } = require('../middleware/auth');

router.get('/me', auth, authController.getProfile);
// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// Cập nhật tên người dùng
router.put("/profile", authController.updateProfile);

router.get('/me', auth, authController.getProfile);
// Đổi mật khẩu
router.put("/change-password", authController.changePassword);

// Quản lý khách hàng (admin)
const { getAllUsers, getUserById, updateUser, updateUserNote, updateUserStatus, updateUserType, addAddress, updateAddress, deleteAddress } = require("../controllers/auth.controller");

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/note', updateUserNote);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/type', updateUserType);
router.post('/users/:id/address', addAddress);
router.put('/users/:id/address', updateAddress);
router.delete('/users/:id/address', deleteAddress);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;