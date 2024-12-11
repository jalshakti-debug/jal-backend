const mongoose = require('mongoose');

// Helper function to generate random Ven_Id
function generateVendorId() {
  return `VEN-${Math.floor(1000 + Math.random() * 9000)}`;
}

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  address: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,   },
  Ven_Id: { 
    type: String, 
    unique: true, 
    default: generateVendorId 
  }, // Generate random Ven_Id
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vendor', vendorSchema);
