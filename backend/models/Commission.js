const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
    commission_id: { type: String, required: true, unique: true },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    referred_org_id: { type: String, required: true },
    subscription_id: { type: String },
    invoice_id: { type: String },
    event_type: { type: String, enum: ['new_subscription', 'renewal', 'upgrade'], required: true },
    plan_amount: { type: Number, required: true },
    commission_rate: { type: Number, required: true },
    gross_commission: { type: Number, required: true },
    pass_through_amount: { type: Number, default: 0 },
    net_commission: { type: Number, required: true },
    tier_at_creation: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'payable', 'paid', 'clawed_back'],
        default: 'pending'
    },
    hold_until: { type: Date, required: true },
    payout_statement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
}, { timestamps: true });

commissionSchema.index({ partner_id: 1, status: 1 });
commissionSchema.index({ event_type: 1 });
commissionSchema.index({ hold_until: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
