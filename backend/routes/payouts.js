const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const Commission = require('../models/Commission');

// GET /payouts
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const partner_id = req.query.partner_id;

        let query = {};
        if (partner_id) query.partner_id = partner_id;

        const payouts = await Payout.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ payouts });
    } catch (error) {
        next(error);
    }
});

// POST /payouts (Generate Statement)
router.post('/', async (req, res, next) => {
    try {
        const { partner_id, period_start, period_end } = req.body;

        const payableCommissions = await Commission.find({
            partner_id,
            status: 'payable',
            createdAt: { $gte: new Date(period_start), $lte: new Date(period_end) }
        });

        if (payableCommissions.length === 0) {
            return res.status(409).json({ error: "No payable commissions found for this partner in the selected period." });
        }

        const netPayable = payableCommissions.reduce((sum, c) => sum + c.net_commission, 0);

        const statement = new Payout({
            statement_id: `PAY-${Date.now()}`,
            partner_id,
            period_start,
            period_end,
            total_commissions: netPayable,
            net_payable: netPayable,
            status: 'draft',
            commission_ids: payableCommissions.map(c => c._id)
        });

        await statement.save();
        res.status(201).json(statement);
    } catch (error) {
        next(error);
    }
});

// View, finalize and disburse endpoints...
module.exports = router;
