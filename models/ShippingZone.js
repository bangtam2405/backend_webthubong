const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  provinces: [{
    type: String,
    required: true
  }],
  wards: [{
    type: String,
    required: true
  }],
  baseFee: {
    type: Number,
    required: true,
    min: 0
  },
  freeThreshold: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingZone', shippingZoneSchema); 