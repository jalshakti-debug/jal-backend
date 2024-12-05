const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateComplaintId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `comp-user-${randomNum}`;
}

const userComplaintSchema = new Schema({
    consumerId: { // Change from userId to consumerId
        type: String, // Assuming consumerId is a string
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

// Export the model
module.exports = mongoose.model('UserComplaint', userComplaintSchema);