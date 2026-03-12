const express = require('express');
const router = express.Router();
const Commission = require('../models/Commission');

// GET /commissions
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

        // Example: send aggregated hold stats
        res.json({ commissions });
    } catch (error) {
        next(error);
    }
});

// GET /commissions/:id
router.get('/:id', async (req, res, next) => {
    try {
        const commission = await Commission.findById(req.params.id);
        if (!commission) return res.status(404).json({ error: "Commission not found" });
        res.json(commission);
    } catch (error) {
        next(error);
    }
});

// POST /commissions/release-payable
router.post('/release-payable', async (req, res, next) => {
    try {
        // Finds all pending commissions where hold_until is in the past, updates to payable
        const result = await Commission.updateMany(
            { status: 'pending', hold_until: { $lte: new Date() } },
            { $set: { status: 'payable' } }
        );
        res.json({ message: `${result.modifiedCount} commissions released to payable` });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
