const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Partner = require('../models/Partner');

router.post('/login', async (req, res, next) => {
    try {
        const { companyName, email, password } = req.body;

        if (!companyName || !email || !password) {
            return res.status(400).json({ error: "Company name, email, and password are required." });
        }

        // 1. Admin Login Hardcoded
        if (email === 'admin@gmail.com') {
            if (companyName.toLowerCase() === 'groove' && password === 'admin@123') {
                const token = jwt.sign(
                    { id: 'admin_id_001', role: 'admin' },
                    process.env.JWT_SECRET || 'fallback_secret_key',
                    { expiresIn: '1d' }
                );
                return res.json({ token, role: 'admin', user: { email: 'admin@gmail.com', name: 'Super Admin' } });
            } else {
                return res.status(401).json({ error: "Invalid admin credentials." });
            }
        }

        // 2. Partner Login Lookup
        console.log(`[AUTH DEBUG] Attempting partner login for Email: '${email}' Company: '${companyName}'`);
        // Case insensitive regex for company name to ensure ease of login

        // Escape characters for RegEx
        const escapedCompanyName = companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const partner = await Partner.findOne({
            "kyc.email": email,
            "kyc.company_name": new RegExp('^' + escapedCompanyName + '$', 'i')
        });

        if (!partner) {
            console.log(`[AUTH DEBUG] Partner not found in DB!`);
            return res.status(401).json({ error: "Invalid credentials." });
        }
        console.log(`[AUTH DEBUG] Partner found: ${partner._id}. Checking hash...`);

        // Verify Hash
        const isMatch = await bcrypt.compare(password, partner.password);
        if (!isMatch) {
            console.log(`[AUTH DEBUG] Password hash mismatch!`);
            return res.status(401).json({ error: "Invalid credentials." });
        }
        console.log(`[AUTH DEBUG] Success! Logging in...`);

        // Optional: Block suspended partners from logging in
        // if (partner.status === 'suspended' || partner.status === 'terminated') {
        //     return res.status(403).json({ error: "Account access restricted." });
        // }

        const token = jwt.sign(
            { id: partner._id, role: 'partner' },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.json({ token, role: 'partner', user: { id: partner._id, email: partner.kyc.email, name: partner.kyc.company_name } });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
