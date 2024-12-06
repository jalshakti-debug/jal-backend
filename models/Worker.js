const mongoose = require('mongoose');
const Grampanchayat = require('./Grampanchayat');
const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Validate 10-digit mobile number
      },
      message: (props) => `${props.value} is not a valid mobile number!`,
    },
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  grampanchayatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Grampanchayat', // Ensure this matches the Grampanchayat model name
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Worker', workerSchema);