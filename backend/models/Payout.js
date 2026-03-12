const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    statement_id: { type: String, required: true, unique: true },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    total_commissions: { type: Number, required: true },
    total_clawbacks: { type: Number, default: 0 },
    net_payable: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'finalized', 'disbursed'], default: 'draft' },
    disbursed_at: { type: Date },
    disbursed_by: { type: String }, // admin id
    disbursement_notes: { type: String, maxlength: 500 },
    commission_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commission' }]
}, { timestamps: true });

payoutSchema.index({ partner_id: 1, status: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
