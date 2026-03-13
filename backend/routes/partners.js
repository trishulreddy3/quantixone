const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const Contract = require('../models/Contract');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
const ReferralCode = require('../models/ReferralCode');
const bcrypt = require('bcryptjs');

// POST /partners - Onboard new partner (Admin)
router.post('/', async (req, res, next) => {
    try {
        const { kyc, bank, notes, password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Partner password is required" });
        }

        // Check for email collision
        const existing = await Partner.findOne({ "kyc.email": kyc.email });
        if (existing) {
            return res.status(409).json({ error: "Partner email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const partner = new Partner({ kyc, bank, notes, password: hashedPassword });
        await partner.save();
        res.status(201).json(partner);
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

// GET /partners - List partners (Admin)
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const search = req.query.search;

        let query = {};
        if (status && status !== 'All') query.status = status;
        if (search) {
            // Use regex search as fallback (text index may not be set up)
            query.$or = [
                { "kyc.company_name": { $regex: search, $options: 'i' } },
                { "kyc.email": { $regex: search, $options: 'i' } }
            ];
        }

        const partners = await Partner.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Partner.countDocuments(query);
        res.json({ partners, total });
    } catch (error) {
        next(error);
    }
});

// GET /partners/:id - Partner detail (Admin / Partner own)
router.get('/:id', async (req, res, next) => {
    try {
        const partner = await Partner.findById(req.params.id);
        if (!partner) return res.status(404).json({ error: "Partner not found" });
        res.json(partner);
    } catch (error) {
        next(error);
    }
});

// PATCH /partners/:id/status - Update partner status (Admin)
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending_review', 'approved', 'contract_sent', 'active', 'suspended', 'terminated'];

        if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

        const partner = await Partner.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!partner) return res.status(404).json({ error: "Partner not found" });
        res.json(partner);
    } catch (error) {
        next(error);
    }
});

// PUT /partners/:id - Edit partner bank/notes (Admin)
router.put('/:id', async (req, res, next) => {
    try {
        const { bank, notes } = req.body;
        const partner = await Partner.findById(req.params.id);
        if (!partner) return res.status(404).json({ error: "Partner not found" });

        if (bank) partner.bank = bank;
        if (notes !== undefined) partner.notes = notes;

        await partner.save();
        res.json(partner);
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

// PATCH /partners/:id/password - Update partner password (Admin)
router.patch('/:id/password', async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: "Password is required" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const partner = await Partner.findByIdAndUpdate(req.params.id, { password: hashedPassword }, { new: true });
        if (!partner) return res.status(404).json({ error: "Partner not found" });
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        next(error);
    }
});

// PATCH /partners/:id/stats - Recalculate and update partner tier/stats (called after new commission or org referral)
router.patch('/:id/stats', async (req, res, next) => {
    try {
        const partner = await Partner.findById(req.params.id);
        if (!partner) return res.status(404).json({ error: "Partner not found" });

        // Count distinct referred orgs from referral codes
        const codes = await ReferralCode.find({ partner_id: req.params.id });
        const totalOrgsReferred = codes.reduce((sum, c) => sum + (c.total_uses || 0), 0);

        // Compute total commissions earned
        const commissionAgg = await Commission.aggregate([
            { $match: { partner_id: partner._id } },
            { $group: { _id: null, total: { $sum: '$net_commission' } } }
        ]);
        const totalEarned = commissionAgg[0]?.total || 0;

        // Determine tier from slab config
        const SlabConfig = require('../models/SlabConfig');
        const slabConfig = await SlabConfig.findOne().sort({ createdAt: -1 });
        let newTier = 1;
        if (slabConfig && slabConfig.tiers) {
            for (const tier of slabConfig.tiers) {
                if (totalOrgsReferred >= tier.min_orgs && (tier.max_orgs === null || totalOrgsReferred <= tier.max_orgs)) {
                    newTier = tier.tier;
                    break;
                }
            }
        }

        partner.total_orgs_referred = totalOrgsReferred;
        partner.total_commissions_earned = totalEarned;
        partner.current_tier = newTier;
        await partner.save();

        res.json(partner);
    } catch (error) {
        next(error);
    }
});

// DELETE /partners/:id - Delete partner and all associated data (Admin)
router.delete('/:id', async (req, res, next) => {
    try {
        const partnerId = req.params.id;
        const partner = await Partner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }

        // Cascading deletion
        await Promise.all([
            Contract.deleteMany({ partner_id: partnerId }),
            Commission.deleteMany({ partner_id: partnerId }),
            Payout.deleteMany({ partner_id: partnerId }),
            ReferralCode.deleteMany({ partner_id: partnerId })
        ]);

        await Partner.findByIdAndDelete(partnerId);

        res.json({ message: "Partner and all associated records deleted successfully." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
