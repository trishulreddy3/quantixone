const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Partner = require('../models/Partner');

// POST /contracts
router.post('/', async (req, res, next) => {
    try {
        const { partner_id } = req.body;
        const partner = await Partner.findById(partner_id);
        if (!partner) return res.status(404).json({ error: "Partner not found" });
        if (partner.status !== 'approved') return res.status(409).json({ error: "Partner must be in approved status to create a contract" });

        const contract = new Contract({ partner_id, status: 'draft' });
        await contract.save();

        // Update partner status
        partner.status = 'contract_sent';
        await partner.save();

        res.status(201).json(contract);
    } catch (error) {
        next(error);
    }
});

// GET /contracts
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const partner_id = req.query.partner_id;

        let query = {};
        if (partner_id) query.partner_id = partner_id;

        const contracts = await Contract.find(query)
            .populate('partner_id', 'kyc.company_name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({ contracts });
    } catch (error) {
        next(error);
    }
});

// Further endpoints: countersign, S3 upload URL generation, terminate
module.exports = router;
