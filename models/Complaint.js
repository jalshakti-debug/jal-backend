const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/// Export the generateComplainNo function along with the schema
const generateComplainNo = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000); // Generates a random number (e.g., 1234)
    return `CPL-${timestamp}-${randomNum}`;
};

const complaintSchema = new Schema({
    complainNo: {
        type: String,
        required: true,
        unique: true,
        default: generateComplainNo, // Ensure it's set here
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 0
    },
    purpose: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat', 
        required: true  
    },
});

module.exports = { 
    Complaint: mongoose.model('Complaint', complaintSchema),
    generateComplainNo  // Export the function
};
