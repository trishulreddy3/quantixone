const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// --- 1. Security & HTTP Headers ---
// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

// --- 2. CORS (Cross-Origin Resource Sharing) ---
app.use(cors({
  origin: function (origin, callback) {
    // Allow all localhost origins during development, or the exact env URL
    if (!origin || origin.startsWith('http://localhost') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// --- 3. Body Parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 4. Compression ---
// Compress all responses for performance improvement (Gzip)
app.use(compression());

// --- 5. Request Logging ---
// Morgan logs incoming requests based on the remote address, method, URL, status code, etc.
app.use(morgan('combined'));

// --- 6. Rate Limiting ---
// Protect against brute-force/DDoS attacks by limiting repeated requests to public APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per `window` during development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
// Apply the rate limiting middleware to API calls only
app.use('/api', apiLimiter);

// --- 7. Basic Route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running healthily' });
});

// --- 8. REST Controllers Mounting ---
app.use('/api/auth', require('./routes/auth'));

// Protect all following routes with JWT
app.use('/api', authMiddleware);

app.use('/api/partners', require('./routes/partners'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/slab-config', require('./routes/slabConfig'));
app.use('/api/referral-codes', require('./routes/referralCodes'));

// --- 9. Non-Existent Routes Handling ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// --- 9. Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error('[Error:', err.stack, ']');
  res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

module.exports = app;
