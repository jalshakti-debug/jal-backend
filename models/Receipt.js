const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  
  gpId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' },
  typeOfBill: {
    type: String,
    enum: ['expenditure', 'income'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Receipt', ReceiptSchema);
