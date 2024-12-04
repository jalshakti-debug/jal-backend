const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./GramUser');

function generateComplaintId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `comp-user-${randomNum}`;
}

const userComplaintSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    complaintId: {
        type: String,
        default: generateComplaintId,
        unique: true,
        required: true,
    },
    complaintDetails: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    },
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat', // Reference to Grampanchayat model
        required: true, // This will link the complaint to the user's Grampanchayat
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

module.exports = mongoose.model('UserComplaint', userComplaintSchema);
