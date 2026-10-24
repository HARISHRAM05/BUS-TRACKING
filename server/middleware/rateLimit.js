// Rate limiting for the login and sign-up endpoints (brute-force protection)
const rateLimit = require('express-rate-limit');

// Only FAILED attempts count (skipSuccessfulRequests), so normal users are never blocked.
// After AUTH_RATE_LIMIT_MAX failures from one IP within the window, further attempts get 429.
const authLimiter = rateLimit({
  windowMs: (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: true, // sends RateLimit-* headers
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please wait a few minutes and try again.',
    }),
});

module.exports = { authLimiter };
