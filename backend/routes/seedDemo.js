const express = require('express');
const bcrypt = require('bcryptjs');
const Partner = require('../models/Partner');
const Contract = require('../models/Contract');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');

const router = express.Router();

// POST /seed-demo
// Creates a demo partner + contract + commission + payout statement.
// Enabled only in development or when ENABLE_DEMO_SEED=true.
router.post('/', async (req, res, next) => {
    try {
        const allow = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_SEED === 'true';
        if (!allow) {
            return res.status(403).json({ error: 'Seed demo endpoint is disabled in this environment.' });
        }

        // Accept optional partner lookup fields so we can seed against an existing partner.
        const { partner_id, partner_email, partner_company } = req.body;

        let partner;
        if (partner_id) {
            partner = await Partner.findById(partner_id);
        } else if (partner_email) {
            const companyQuery = partner_company ? { 'kyc.company_name': partner_company } : {};
            partner = await Partner.findOne({ 'kyc.email': partner_email, ...companyQuery });
        }

        // If partner not found, create a new demo partner
        let newPartnerCredentials = null;
        if (!partner) {
            const timestamp = Date.now();
            const demoEmail = `demo+${timestamp}@example.com`;
            const demoCompany = `Demo Corp ${timestamp}`;
            const demoPassword = `Demo#${Math.floor(Math.random() * 9000 + 1000)}`;

            const hashedPassword = await bcrypt.hash(demoPassword, 10);
            partner = new Partner({
                kyc: {
                    company_name: demoCompany,
                    contact_person_name: 'Demo User',
                    email: demoEmail,
                    phone: '9999999999',
                    aadhar_number: '111122223333',
                    pan_number: 'ABCDE1234F',
                    gst_number: '22ABCDE1234F1Z5',
                    dpiit_number: 'DPIIT12345'
                },
                bank: {
                    beneficiary_name: demoCompany,
                    account_number: '123456789012',
                    ifsc_code: 'HDFC0001234',
                    bank_name: 'Demo Bank',
                    branch: 'Demo Branch'
                },
                notes: 'Seed demo partner created via /seed-demo.',
                password: hashedPassword,
                status: 'active',
                current_tier: 1,
                total_orgs_referred: 1,
                total_commissions_earned: 0,
                total_commissions_paid: 0
            });
            await partner.save();
            newPartnerCredentials = { email: demoEmail, password: demoPassword };
        }

        // Ensure partner is active so commissions/payouts show up
        if (!['active', 'contract_sent'].includes(partner.status)) {
            partner.status = 'active';
            await partner.save();
        }

        // Create an active contract (if none exists)
        const existingContract = await Contract.findOne({ partner_id: partner._id, status: { $in: ['draft', 'partner_signed', 'active'] } });
        const contract = existingContract || await new Contract({
            partner_id: partner._id,
            status: 'active',
            partner_signed_at: new Date(),
            admin_signed_at: new Date(),
            signed_by: 'demo-user'
        }).save();

        // Create a commission record (payable)
        const timestamp = Date.now();
        const commission = new Commission({
            commission_id: `COM-DEMO-${timestamp}`,
            partner_id: partner._id,
            referred_org_id: `ORG-DEMO-${timestamp}`,
            subscription_id: `SUBS-DEMO-${timestamp}`,
            invoice_id: `INV-DEMO-${timestamp}`,
            event_type: 'new_subscription',
            plan_amount: 100000,
            commission_rate: 15,
            gross_commission: 15000,
            pass_through_amount: 0,
            net_commission: 15000,
            tier_at_creation: 1,
            status: 'payable',
            hold_until: new Date(Date.now() - 24 * 60 * 60 * 1000) // already passed
        });
        await commission.save();

        // Update partner earnings
        partner.total_commissions_earned = (partner.total_commissions_earned || 0) + 15000;
        await partner.save();

        // Create a payout statement containing the commission
        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const periodEnd = new Date();
        const payout = new Payout({
            statement_id: `PAY-DEMO-${timestamp}`,
            partner_id: partner._id,
            period_start: periodStart,
            period_end: periodEnd,
            total_commissions: commission.net_commission,
            net_payable: commission.net_commission,
            status: 'draft',
            commission_ids: [commission._id]
        });
        await payout.save();

        res.json({
            partner: partner.toObject(),
            contract: contract.toObject(),
            commission: commission.toObject(),
            payout: payout.toObject(),
            created_credentials: newPartnerCredentials
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
