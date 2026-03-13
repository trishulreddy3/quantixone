const express = require('express');
const router = express.Router();
const SlabConfig = require('../models/SlabConfig');

// GET /slab-config
router.get('/', async (req, res, next) => {
    try {
        // Return latest config
        let config = await SlabConfig.findOne().sort({ createdAt: -1 });
        if (!config) {
            // Provide a sensible default for new installs
            const defaultTiers = [
                { tier: 1, min_orgs: 0, max_orgs: 9, new_rate: 15, renewal_rate: 10 },
                { tier: 2, min_orgs: 10, max_orgs: 49, new_rate: 12, renewal_rate: 8 },
                { tier: 3, min_orgs: 50, max_orgs: null, new_rate: 10, renewal_rate: 5 }
            ];
            config = new SlabConfig({ tiers: defaultTiers, updated_by: 'system' });
            await config.save();
        }
        res.json(config);
    } catch (error) {
        next(error);
    }
});

// PUT /slab-config
router.put('/', async (req, res, next) => {
    try {
        const { tiers, updated_by } = req.body;

        // In production we should do strict validation of the tiers payload here
        const config = new SlabConfig({ tiers, updated_by });
        await config.save();

        res.json(config);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
