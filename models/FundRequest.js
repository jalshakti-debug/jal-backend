// models/FundRequest.js
const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema({
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat',
        required: true,
    },
    amountRequested: {
        type: Number,
        required: true,
    },
    purpose: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update the updatedAt field
fundRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const FundRequest = mongoose.model('FundRequest', fundRequestSchema);
module.exports = FundRequest;