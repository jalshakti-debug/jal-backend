const mongoose = require('mongoose');

// Define the Inventory schema
const inventorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true // Ensures no trailing spaces
  }, // Inventory item name
  category: { 
    type: String, 
    required: true, 
    trim: true // Ensures no trailing spaces
  }, // Inventory category (e.g., "Chemicals", "Pipes", etc.)
  quantity: { 
    type: Number, 
    default: 0, 
    min: 0 // Ensures quantity cannot be negative
  }, // Current quantity of the inventory item
  creditOrDebit: { type: String, enum: ['credit', 'debit'] },
  editHistory: [
    {
      date: { 
        type: Date, 
        default: Date.now 
      }, // Date of edit
      quantityAdded: { 
        type: Number, 
        required: true 
      }, // Quantity added or modified
      updatedQuantity: { 
        type: Number, 
        required: true 
      }, // Quantity after the edit
      description: { 
        type: String, 
        required: true, 
        trim: true 
      }, // Description of the change
      creditOrDebit: { type: String, enum: ['credit', 'debit'] },
      gramPanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' }, // Add gramPanchayatId to the editHistory
    },
  ],
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt fields
});

// Export the model with the name 'InventoryPhed'
module.exports = mongoose.model('InventoryGp', inventorySchema);
