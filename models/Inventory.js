const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    location: {
        type: String,
        required: true,
        default: 'Main Warehouse'
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
        default: 'in_stock'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Add index for faster queries
inventorySchema.index({ productId: 1 });
inventorySchema.index({ status: 1 });

// Middleware to update status based on quantity
inventorySchema.pre('save', function(next) {
    if (this.quantity <= 0) {
        this.status = 'out_of_stock';
    } else if (this.quantity < 10) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema); 