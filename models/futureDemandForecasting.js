const mongoose = require('mongoose');

const futureDemandForecastingSchema = new mongoose.Schema({
  grampanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat', required: true }, // Reference to Grampanchayat
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryGp', required: true }, // Reference to Inventory
  message: { type: String, required: true }, // Notification message
  createdAt: { type: Date, default: Date.now }, // Timestamp
  isRead: { type: Boolean, default: false }, // Read status
});

module.exports = mongoose.model('futureDemandForecasting', futureDemandForecastingSchema);
