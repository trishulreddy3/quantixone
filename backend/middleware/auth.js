const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Expected header: "Authorization: Bearer <token>"
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded; // { id, role }
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

const partnerMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'partner') {
        return res.status(403).json({ error: 'Access denied. Partner only.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, partnerMiddleware };
