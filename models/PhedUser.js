const mongoose = require('mongoose');

const PhedUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\+?[1-9]\d{1,14}$/.test(v); // Validate E.164 phone format
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  phed_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('PhedUser', PhedUserSchema);
