const express = require('express');
const router = express.Router();
const Commission = require('../models/Commission');

// IMPORTANT: Place specific routes BEFORE /:id to avoid route conflicts
// POST /commissions/release-payable — Release pending commissions past hold date
router.post('/release-payable', async (req, res, next) => {
    try {
        const result = await Commission.updateMany(
            { status: 'pending', hold_until: { $lte: new Date() } },
            { $set: { status: 'payable' } }
        );
        res.json({
            message: `${result.modifiedCount} commissions released to payable`,
            released_count: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
});

// GET /commissions — List commissions with filters
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const { status, partner_id, event_type } = req.query;

        let query = {};
        if (status && status !== 'All') query.status = status;
        if (partner_id) query.partner_id = partner_id;
        if (event_type && event_type !== 'All') query.event_type = event_type;

        const commissions = await Commission.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Commission.countDocuments(query);
        res.json({ commissions, total });
    } catch (error) {
        next(error);
    }
});

// GET /commissions/:id — Get single commission
router.get('/:id', async (req, res, next) => {
    try {
        const commission = await Commission.findById(req.params.id);
        if (!commission) return res.status(404).json({ error: "Commission not found" });
        res.json({ commission });
    } catch (error) {
        next(error);
    }
});

// POST /commissions — Create a commission record (called by billing/subscription service)
router.post('/', async (req, res, next) => {
    try {
        const {
            partner_id, referred_org_id, subscription_id, invoice_id,
            event_type, plan_amount, commission_rate, gross_commission,
            pass_through_amount, net_commission, tier_at_creation, hold_until
        } = req.body;

        const commission = new Commission({
            commission_id: `COM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            partner_id,
            referred_org_id,
            subscription_id,
            invoice_id,
            event_type,
            plan_amount,
            commission_rate,
            gross_commission,
            pass_through_amount: pass_through_amount || 0,
            net_commission,
            tier_at_creation,
            hold_until: hold_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30-day hold
        });

        await commission.save();

        // Update partner stats
        const Commission2 = require('../models/Commission');
        const total = await Commission2.aggregate([
            { $match: { partner_id: commission.partner_id } },
            { $group: { _id: null, total: { $sum: '$net_commission' } } }
        ]);
        const totalEarned = total[0]?.total || 0;

        const Partner = require('../models/Partner');
        await Partner.findByIdAndUpdate(partner_id, {
            total_commissions_earned: totalEarned
        });

        res.status(201).json({ commission });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

module.exports = router;
