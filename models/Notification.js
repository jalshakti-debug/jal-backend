const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Grampanchayat = require('./Grampanchayat');
// Define Notification Schema
const notificationSchema = new Schema({
    title: {
        type: String,
        required: true, // Title of the notification
        trim: true
    },
    message: {
        type: String,
        required: true, // Body/content of the notification
    },
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat',
        required: true // The Grampanchayat who created the notification
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the current date/time
    }
});

// Create the model for Notification
module.exports = mongoose.model('Notification', notificationSchema);
