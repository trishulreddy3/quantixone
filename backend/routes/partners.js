const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const Contract = require('../models/Contract');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
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
        if (search) query.$text = { $search: search };

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
        if (notes) partner.notes = notes;

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
            Payout.deleteMany({ partner_id: partnerId })
        ]);

        await Partner.findByIdAndDelete(partnerId);

        res.json({ message: "Partner and all associated records deleted successfully." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
