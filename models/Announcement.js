const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat', required: true }, // Reference to Grampanchayat
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the model
module.exports = mongoose.model('Announcement', announcementSchema);
