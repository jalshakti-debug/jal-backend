const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  grampanchayatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grampanchayat',
    required: true
  },
  assetType: {
    type: String,
    required: true
  },
  assetQuantity: {
    type: Number,
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
