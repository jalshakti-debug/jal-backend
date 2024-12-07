const mongoose = require('mongoose');

const FinancialOverviewSchema = new mongoose.Schema({
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Grampanchayat', 
        required: true ,
    },
    source: {
        type: String, // e.g., "PHED", "Government", or custom source
        required: true
    },
    description: {
        type: String, // Description of the transaction
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'], // Credit or Debit
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('FinancialOverview', FinancialOverviewSchema);
