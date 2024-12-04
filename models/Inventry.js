const mongoose = require('mongoose');

// Define the inventory schema
const inventorySchema = new mongoose.Schema({
    grampanchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grampanchayat',  // Reference to the Grampanchayat model
        required: true,
    },
    chemical: {
        type: [String],  // Array of strings to store chemical items like 'Antiforms', 'Biocides'
        default: [],
    },
    filter: {
        type: [String],  // Array of strings to store filter items like 'Sand Filter', 'Carbon Filter'
        default: [],
    },
    spareParts: {
        type: [String],  // Array of strings to store spare parts like 'Cleaning Agent', 'Safety Equipment'
        default: [],
    },
    amount_spent: {
        type: Number,
        required: true,  // The total amount spent for the inventory
    },
    receipt: {
        type: String,  // Store receipt URL or file path
        required: true,  // This should be provided for the inventory record
    },
    createdAt: {
        type: Date,
        default: Date.now,  // Automatically set the date when the inventory record is created
    },
});

// Create and export the model
module.exports = mongoose.model('Inventory', inventorySchema);
