const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  grampanchayat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grampanchayat',
    required: true,
  },
  status: {
    type: Number, // 0: Pending, 1: Acknowledged
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
