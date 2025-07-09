const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    carrier: {
        type: String,
        required: true
    },
    trackingNumber: {
        type: String,
        unique: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    shippingCost: {
        type: Number,
        required: true
    },
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    }
}, {
    timestamps: true
});

// Add indexes for faster queries
shippingSchema.index({ orderId: 1 });
shippingSchema.index({ trackingNumber: 1 });

module.exports = mongoose.model('Shipping', shippingSchema); 