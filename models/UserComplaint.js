
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GramUser = require('./GramUser');

function generateComplaintId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `comp-user-${randomNum}`;
}

const userComplaintSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GramUser',
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
        enum: ['Pending','Resolved', ],
    },
    grampanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' },
},{timestamps: true}
);

module.exports = mongoose.model('UserComplaint', userComplaintSchema);
