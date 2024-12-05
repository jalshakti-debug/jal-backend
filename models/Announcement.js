// models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat', required: true },
  grampanchayatId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Announcement', announcementSchema);