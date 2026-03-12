const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    pass_through: {
        enabled: { type: Boolean, default: false },
        partner_discount_pct: { type: Number, min: 0, max: 100, default: 0 }
    },
    expires_at: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    total_uses: { type: Number, default: 0 },
    total_commissions_earned: { type: Number, default: 0 }
}, { timestamps: true });

referralCodeSchema.index({ code: 1 });
referralCodeSchema.index({ partner_id: 1 });

module.exports = mongoose.model('ReferralCode', referralCodeSchema);
