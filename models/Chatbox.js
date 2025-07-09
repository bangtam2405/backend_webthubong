const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'sketch', 'image'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    aiResponse: {
        designImage: String,
        description: String,
        specifications: {
            size: String,
            materials: [String],
            colors: [String],
            estimatedPrice: Number
        }
    },
    feedback: {
        rating: Number,
        comment: String
    }
}, {
    timestamps: true
});

const chatboxSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    designRequests: [designRequestSchema],
    currentDesign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Design'
    },
    context: {
        style: String,
        preferences: [String],
        previousDesigns: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Design'
        }]
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add indexes for faster queries
chatboxSchema.index({ userId: 1 });
chatboxSchema.index({ sessionId: 1 });
chatboxSchema.index({ 'designRequests.status': 1 });

module.exports = mongoose.model('Chatbox', chatboxSchema); 