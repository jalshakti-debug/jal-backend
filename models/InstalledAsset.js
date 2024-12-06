const mongoose = require('mongoose');

const InstalledAssetSchema = new mongoose.Schema({
    assetsType: {
        type: String,
        required: true
    },
    assetsStatus: {
         type: String,
        required: true 
    },
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Grampanchayat', 
        required: true ,
    },
    latitude: {
        type: Number,
        required: true 
    },
    longitude: {
        type: Number,
        required: true 
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Worker', 
        required: true 
    },
    assetsIdentificationId: {
        type: String,
        unique: true,
        required: true 
    },
    status: {
        type: String,
        default: 'active'
    },
    userId: {
         type: String,
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('InstalledAsset', InstalledAssetSchema);
