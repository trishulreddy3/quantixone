const express = require('express');
const router = express.Router();
const SlabConfig = require('../models/SlabConfig');

const DEFAULT_TIERS = [
    { tier: 1, min_orgs: 0, max_orgs: 9, new_rate: 15, renewal_rate: 10 },
    { tier: 2, min_orgs: 10, max_orgs: 49, new_rate: 12, renewal_rate: 8 },
    { tier: 3, min_orgs: 50, max_orgs: null, new_rate: 10, renewal_rate: 5 }
];

// GET /slab-config — Return latest config (creates default if none exists)
router.get('/', async (req, res, next) => {
    try {
        let config = await SlabConfig.findOne().sort({ createdAt: -1 });
        if (!config) {
            config = new SlabConfig({ tiers: DEFAULT_TIERS, updated_by: 'system' });
            await config.save();
        }
        // Always wrap in { config } for consistent response shape
        res.json({ config });
    } catch (error) {
        next(error);
    }
});

// PUT /slab-config — Save new config version
router.put('/', async (req, res, next) => {
    try {
        const { tiers, updated_by } = req.body;

        if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
            return res.status(400).json({ error: "tiers array is required" });
        }

        const config = new SlabConfig({ tiers, updated_by: updated_by || 'admin' });
        await config.save();

        res.json({ config });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

// POST /slab-config/reset — Reset to system defaults
router.post('/reset', async (req, res, next) => {
    try {
        const config = new SlabConfig({ tiers: DEFAULT_TIERS, updated_by: 'system_reset' });
        await config.save();
        res.json({ config, message: "Slab config reset to defaults." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
