const express = require('express');
const router = express.Router();
const SlabConfig = require('../models/SlabConfig');

// GET /slab-config
router.get('/', async (req, res, next) => {
    try {
        // Return latest config
        const config = await SlabConfig.findOne().sort({ createdAt: -1 });
        if (!config) {
            res.json({ tiers: [] }); // Or default empty state
            return;
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
