const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
     // Reference to Grampanchayat
     receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' , required:true }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the model
module.exports = mongoose.model('Announcement', announcementSchema);
