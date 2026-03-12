const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    status: {
        type: String,
        enum: ['draft', 'partner_signed', 'active', 'terminated'],
        default: 'draft'
    },
    partner_signed_at: { type: Date },
    admin_signed_at: { type: Date },
    partner_signed_s3_key: { type: String },
    admin_signed_s3_key: { type: String },
    signed_by: { type: String }, // admin id
}, { timestamps: true });

contractSchema.index({ partner_id: 1, status: 1 });

module.exports = mongoose.model('Contract', contractSchema);
