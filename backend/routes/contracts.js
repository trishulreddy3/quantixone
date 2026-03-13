const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Partner = require('../models/Partner');

// POST /contracts — Create contract for an eligible partner
router.post('/', async (req, res, next) => {
    try {
        const { partner_id } = req.body;
        const partner = await Partner.findById(partner_id);
        if (!partner) return res.status(404).json({ error: "Partner not found" });

        // Allow contract creation for partners that are approved or in pending_review (for quick onboarding).
        // Do not allow for suspended/terminated partners.
        if (['suspended', 'terminated'].includes(partner.status)) {
            return res.status(409).json({ error: "Partner is not in an eligible status to create a contract" });
        }

        const contract = new Contract({ partner_id, status: 'draft' });
        await contract.save();

        // Move partner to contract_sent if not already further along
        if (!['contract_sent', 'active'].includes(partner.status)) {
            partner.status = 'contract_sent';
            await partner.save();
        }

        res.status(201).json({ contract });
    } catch (error) {
        next(error);
    }
});

// GET /contracts — List all contracts (with optional partner_id filter)
router.get('/', async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const partner_id = req.query.partner_id;
        const status = req.query.status;

        let query = {};
        if (partner_id) query.partner_id = partner_id;
        if (status && status !== 'All') query.status = status;

        const contracts = await Contract.find(query)
            .populate('partner_id', 'kyc.company_name kyc.email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contract.countDocuments(query);
        res.json({ contracts, total });
    } catch (error) {
        next(error);
    }
});

// GET /contracts/:id — Get single contract detail
router.get('/:id', async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('partner_id', 'kyc.company_name kyc.email status');
        if (!contract) return res.status(404).json({ error: "Contract not found" });
        res.json({ contract });
    } catch (error) {
        next(error);
    }
});

// GET /contracts/:id/upload-url — Generate a mock pre-signed URL (no S3 in dev)
router.get('/:id/upload-url', async (req, res, next) => {
    try {
        const { party, filename } = req.query;
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });

        // In production this would call AWS S3 SDK to generate a pre-signed PUT URL
        // For now, we return a mock URL structure
        const s3Key = `contracts/${req.params.id}/${party}_${filename || 'document.pdf'}`;
        const mockUploadUrl = `https://s3.amazonaws.com/quantixone-contracts/${s3Key}?mock=true&expires=300`;

        res.json({
            upload_url: mockUploadUrl,
            s3_key: s3Key,
            expires_in_seconds: 300
        });
    } catch (error) {
        next(error);
    }
});

// POST /contracts/:id/partner-sign — Record partner signature
router.post('/:id/partner-sign', async (req, res, next) => {
    try {
        const { s3_key } = req.body;
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });

        contract.status = 'partner_signed';
        contract.partner_signed_at = new Date();
        if (s3_key) contract.partner_signed_s3_key = s3_key;
        await contract.save();

        res.json({ contract });
    } catch (error) {
        next(error);
    }
});

// POST /contracts/:id/admin-countersign — Admin countersigns, activates contract + partner
router.post('/:id/admin-countersign', async (req, res, next) => {
    try {
        const { s3_key, signed_by } = req.body;
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });
        if (contract.status !== 'partner_signed') {
            return res.status(409).json({ error: "Contract must be in partner_signed status for admin countersign" });
        }

        contract.status = 'active';
        contract.admin_signed_at = new Date();
        if (s3_key) contract.admin_signed_s3_key = s3_key;
        if (signed_by) contract.signed_by = signed_by;
        await contract.save();

        // Also activate the partner
        await Partner.findByIdAndUpdate(contract.partner_id, { status: 'active' });

        res.json({ contract });
    } catch (error) {
        next(error);
    }
});

// POST /contracts/:id/terminate — Terminate contract
router.post('/:id/terminate', async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });
        if (contract.status === 'terminated') {
            return res.status(409).json({ error: "Contract is already terminated" });
        }

        contract.status = 'terminated';
        await contract.save();

        res.json({ contract });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
