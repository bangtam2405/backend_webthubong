// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true, // không trùng tên đăng nhập
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  dob: { type: Date },
  status: {
    type: String,
    enum: ['active', 'locked', 'pending'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['new', 'vip', 'regular'],
    default: 'new'
  },
  addresses: [
    {
      label: String, // ví dụ: Nhà, Công ty
      address: String,
      isDefault: { type: Boolean, default: false }
    }
  ],
  note: { type: String, default: '' },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  refreshToken: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  avatar: { type: String, default: '' }, // Thêm trường avatar
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);



