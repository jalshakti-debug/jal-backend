const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true}, // Asset name
  quantity: { type: Number, default: 0 }, // Current quantity of the asset
  editHistory: [
    {
      date: { type: Date, default: Date.now }, // Date of edit
      quantityAdded: Number, // Quantity added or modified
      updatedQuantity: Number, // Quantity after the edit
      description: { type: String, required :true }, // Description of the change
      creditOrDebit: { type: String, enum: ['credit', 'debit'] },
      gramPanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' }
    },
  ],
});

// Change the model name here to 'AssetPhed'
module.exports = mongoose.model('AssetPhed', assetSchema);
