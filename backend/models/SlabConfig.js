const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
    tier: { type: Number, required: true },
    min_orgs: { type: Number, required: true, min: 0 },
    max_orgs: { type: Number, default: null }, // null means unlimited
    new_rate: { type: Number, required: true, min: 0, max: 100 },
    renewal_rate: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const slabConfigSchema = new mongoose.Schema({
    tiers: [tierSchema],
    updated_by: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SlabConfig', slabConfigSchema);
