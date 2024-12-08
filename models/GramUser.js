const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { 
    type: String,
    required: true,
  },
  mobileNo: { type: String, required: true, unique: true },
  number_aadhar: { type: String, required: true },
  consumerId: { type: String, unique: true }, // Unique ID for login
  password: { type: String, required: true }, // Password for login (hashed)
  status: { type: Number, default: 1 }, // Status (1 - Active, 0 - Inactive)
  OTP: {
    type: Number,
    required: false,
    default: null,
  },
  OTPExpires: {
    type: Date,
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  grampanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' }, // Grampanchayat that created the user
});

module.exports = mongoose.model('GramUser', userSchema);
