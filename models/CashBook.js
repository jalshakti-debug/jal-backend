const mongoose = require('mongoose');

// Define the CashBook schema
const cashBookSchema = new mongoose.Schema(
  {
    fundRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FundRequest',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Create and export the CashBook model
const CashBook = mongoose.model('CashBook', cashBookSchema);

module.exports = CashBook;
