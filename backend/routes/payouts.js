const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const Commission = require('../models/Commission');
const Partner = require('../models/Partner');

// GET /payouts — List payout statements
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const { partner_id, status } = req.query;

        let query = {};
        if (partner_id) query.partner_id = partner_id;
        if (status && status !== 'All') query.status = status;

        const payouts = await Payout.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payout.countDocuments(query);
        res.json({ payouts, total });
    } catch (error) {
        next(error);
    }
});

// GET /payouts/:id — Get single payout detail
router.get('/:id', async (req, res, next) => {
    try {
        // Support lookup by both MongoDB _id and statement_id string
        let payout = await Payout.findById(req.params.id).catch(() => null);
        if (!payout) {
            payout = await Payout.findOne({ statement_id: req.params.id });
        }
        if (!payout) return res.status(404).json({ error: "Payout statement not found" });
        res.json({ payout });
    } catch (error) {
        next(error);
    }
});

// POST /payouts — Generate payout statement
router.post('/', async (req, res, next) => {
    try {
        const { partner_id, period_start, period_end } = req.body;

        if (!partner_id || !period_start || !period_end) {
            return res.status(400).json({ error: "partner_id, period_start, and period_end are required." });
        }

        const payableCommissions = await Commission.find({
            partner_id,
            status: 'payable',
            createdAt: { $gte: new Date(period_start), $lte: new Date(period_end) }
        });

        if (payableCommissions.length === 0) {
            return res.status(409).json({ error: "No payable commissions found for this partner in the selected period." });
        }

        const totalCommissions = payableCommissions.reduce((sum, c) => sum + c.net_commission, 0);

        const statement = new Payout({
            statement_id: `PAY-${Date.now()}`,
            partner_id,
            period_start,
            period_end,
            total_commissions: totalCommissions,
            net_payable: totalCommissions,
            status: 'draft',
            commission_ids: payableCommissions.map(c => c._id)
        });

        await statement.save();
        res.status(201).json({ payout: statement });
    } catch (error) {
        next(error);
    }
});

// POST /payouts/:id/finalize — Lock the statement
router.post('/:id/finalize', async (req, res, next) => {
    try {
        let payout = await Payout.findById(req.params.id).catch(() => null);
        if (!payout) payout = await Payout.findOne({ statement_id: req.params.id });
        if (!payout) return res.status(404).json({ error: "Payout statement not found" });
        if (payout.status !== 'draft') {
            return res.status(409).json({ error: "Payout must be in draft status to finalize" });
        }

        payout.status = 'finalized';
        await payout.save();
        res.json({ payout });
    } catch (error) {
        next(error);
    }
});

// POST /payouts/:id/disburse — Record bank disbursement
router.post('/:id/disburse', async (req, res, next) => {
    try {
        const { disbursed_by, disbursement_notes } = req.body;

        let payout = await Payout.findById(req.params.id).catch(() => null);
        if (!payout) payout = await Payout.findOne({ statement_id: req.params.id });
        if (!payout) return res.status(404).json({ error: "Payout statement not found" });
        if (payout.status !== 'finalized') {
            return res.status(409).json({ error: "Payout must be in finalized status to disburse" });
        }

        payout.status = 'disbursed';
        payout.disbursed_at = new Date();
        payout.disbursed_by = disbursed_by || 'admin';
        if (disbursement_notes) payout.disbursement_notes = disbursement_notes;
        await payout.save();

        // Mark all included commissions as paid
        if (payout.commission_ids && payout.commission_ids.length > 0) {
            await Commission.updateMany(
                { _id: { $in: payout.commission_ids } },
                { $set: { status: 'paid', payout_statement_id: payout._id } }
            );
        }

        // Update partner total_commissions_paid
        const paidSum = payout.net_payable;
        await Partner.findByIdAndUpdate(payout.partner_id, {
            $inc: { total_commissions_paid: paidSum }
        });

        res.json({ payout });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
