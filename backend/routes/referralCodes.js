const express = require('express');
const router = express.Router();
const ReferralCode = require('../models/ReferralCode');

router.get('/partners/:id', async (req, res, next) => {
    try {
        const codes = await ReferralCode.find({ partner_id: req.params.id }).sort({ createdAt: -1 });
        res.json({ referral_codes: codes });
    } catch (error) {
        next(error);
    }
});

router.post('/partners/:id', async (req, res, next) => {
    try {
        const { code, pass_through, expires_at } = req.body;

        const duplicate = await ReferralCode.findOne({ code: code.toUpperCase() });
        if (duplicate) {
            return res.status(400).json({ error: "Code already exists" });
        }

        const newCode = new ReferralCode({
            code,
            partner_id: req.params.id,
            pass_through,
            expires_at
        });

        await newCode.save();
        res.status(201).json(newCode);
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        next(error);
    }
});

module.exports = router;
