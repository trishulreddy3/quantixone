const express = require('express');
const router = express.Router();
const ReferralCode = require('../models/ReferralCode');
const Partner = require('../models/Partner');
const SlabConfig = require('../models/SlabConfig');

// Helper: Recalculate and update partner tier based on total_orgs_referred
async function updatePartnerTier(partnerId) {
    try {
        const codes = await ReferralCode.find({ partner_id: partnerId });
        const totalOrgsReferred = codes.reduce((sum, c) => sum + (c.total_uses || 0), 0);

        const slabConfig = await SlabConfig.findOne().sort({ createdAt: -1 });
        let newTier = 1;
        if (slabConfig && slabConfig.tiers && slabConfig.tiers.length > 0) {
            // Sort tiers ascending to find correct tier
            const sortedTiers = [...slabConfig.tiers].sort((a, b) => a.min_orgs - b.min_orgs);
            for (const tier of sortedTiers) {
                if (totalOrgsReferred >= tier.min_orgs) {
                    newTier = tier.tier;
                }
            }
        }

        await Partner.findByIdAndUpdate(partnerId, {
            total_orgs_referred: totalOrgsReferred,
            current_tier: newTier
        });
    } catch (err) {
        console.error('Failed to update partner tier:', err);
    }
}

// GET /referral-codes/partners/:id — List all codes for a partner
router.get('/partners/:id', async (req, res, next) => {
    try {
        const codes = await ReferralCode.find({ partner_id: req.params.id }).sort({ createdAt: -1 });
        res.json({ referral_codes: codes });
    } catch (error) {
        next(error);
    }
});

// POST /referral-codes/partners/:id — Create new referral code for partner
router.post('/partners/:id', async (req, res, next) => {
    try {
        const { code, pass_through, expires_at } = req.body;

        if (!code) return res.status(400).json({ error: "Code string is required" });

        const duplicate = await ReferralCode.findOne({ code: code.toUpperCase() });
        if (duplicate) {
            return res.status(400).json({ error: "This code is already taken. Try a different one." });
        }

        const newCode = new ReferralCode({
            code: code.toUpperCase(),
            partner_id: req.params.id,
            pass_through: pass_through || { enabled: false, partner_discount_pct: 0 },
            expires_at: expires_at || null
        });

        await newCode.save();
        res.status(201).json({ referral_code: newCode });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

// GET /referral-codes/:id — Get single referral code by MongoDB _id
router.get('/:id', async (req, res, next) => {
    try {
        const code = await ReferralCode.findById(req.params.id);
        if (!code) return res.status(404).json({ error: "Referral code not found" });
        res.json({ referral_code: code });
    } catch (error) {
        next(error);
    }
});

// PUT /referral-codes/:id — Update referral code config
router.put('/:id', async (req, res, next) => {
    try {
        const { pass_through, expires_at, status } = req.body;
        const code = await ReferralCode.findById(req.params.id);
        if (!code) return res.status(404).json({ error: "Referral code not found" });

        if (pass_through !== undefined) code.pass_through = pass_through;
        if (expires_at !== undefined) code.expires_at = expires_at || null;
        if (status !== undefined) code.status = status;

        await code.save();
        res.json({ referral_code: code });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

// POST /referral-codes/use — Called by external billing service when a code is used at checkout
router.post('/use', async (req, res, next) => {
    try {
        const { code, org_id, plan_amount } = req.body;
        if (!code) return res.status(400).json({ error: "code is required" });

        const referralCode = await ReferralCode.findOne({ code: code.toUpperCase() });
        if (!referralCode || referralCode.status !== 'active') {
            return res.status(404).json({ error: "Referral code not found or inactive" });
        }

        if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
            referralCode.status = 'expired';
            await referralCode.save();
            return res.status(400).json({ error: "Referral code has expired" });
        }

        // Increment usage counter
        referralCode.total_uses = (referralCode.total_uses || 0) + 1;
        await referralCode.save();

        // Recalculate partner tier
        await updatePartnerTier(referralCode.partner_id);

        const discount = referralCode.pass_through?.enabled
            ? (Number(plan_amount || 0) * referralCode.pass_through.partner_discount_pct) / 100
            : 0;

        res.json({
            valid: true,
            partner_id: referralCode.partner_id,
            discount_amount: discount,
            pass_through: referralCode.pass_through
        });
    } catch (error) {
        next(error);
    }
});

// POST /referral-codes/validate — Validate a referral code without using it
router.post('/validate', async (req, res, next) => {
    try {
        const { code, amount } = req.body;

        const referralCode = await ReferralCode.findOne({ code: code?.toUpperCase() });
        if (!referralCode || referralCode.status !== 'active') {
            return res.json({ valid: false, applicable: false });
        }

        if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
            return res.json({ valid: true, applicable: false, reasons: ["This code has expired"] });
        }

        const discount = referralCode.pass_through?.enabled
            ? (Number(amount || 0) * referralCode.pass_through.partner_discount_pct) / 100
            : 0;

        res.json({
            valid: true,
            applicable: true,
            partner_id: referralCode.partner_id,
            discount_amount: discount,
            pass_through: referralCode.pass_through
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
