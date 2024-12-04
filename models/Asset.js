const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat',
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount_spent: {
        type: Number,
        required: true,
    },
    receipt: {
        type: String,  // You can store a file URL or file path here
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Asset', assetSchema);
