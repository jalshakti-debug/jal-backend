// Separate Model File: gpResourceModel.js
const mongoose = require('mongoose');

const gpResourceSchema = new mongoose.Schema({
    GP_id: { type: String, required: true, unique: true },
    GP_name: { type: String, required: true },
    sources: [{
        well: { type: Number, default: 0 },
        pond: { type: Number, default: 0 },
        river: { type: Number, default: 0 },
        tupwell: { type: Number, default: 0 },
    }],
    crises_history: { type: String },
    crises_year: { type: Number },
    population: { type: Number, required: true },
    ground_water_level: { type: Number, required: true },
    history: { type: String, required: true },
    nearest_gp: [{ type: String }],
    source_deficiency: { type: Boolean, default: false },
});

module.exports = mongoose.model('gpResource', gpResourceSchema);
