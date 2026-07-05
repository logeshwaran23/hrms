import rateLimit from 'express-rate-limit';

// Strict rate limit for auth endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
