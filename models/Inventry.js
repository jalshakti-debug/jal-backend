const mongoose = require('mongoose');





const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true}, // Invenory Name name
  quantity: { type: Number, default: 0 }, // Current quantity of the asset
  grampanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat', required: true }, // Reference to Grampanchayat
  editHistory: [
    {
      date: { type: Date, default: Date.now }, // Date of edit
      quantityAdded: Number, // Quantity added or modified
      updatedQuantity: Number, // Quantity after the edit
      creditOrDebit: { type: String, enum: ['credit', 'debit'] },
      description: { type: String, required: true }, // Description of the change
    },
  ],
});

module.exports = mongoose.model('InventoryGp', inventorySchema);