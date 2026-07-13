import rateLimit from 'express-rate-limit';

// Strict rate limit for auth endpoints (brute-force protection)
// Keyed by real client IP via X-Forwarded-For (Render/Vercel proxy)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Allow 30 login attempts per IP per 15 min (supports 15-20 users)
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use real client IP from proxy headers, not the proxy IP
    return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      || req.headers['x-real-ip']?.toString()
      || req.ip
      || 'unknown';
  },
});

// General API rate limiter — generous enough for 20 concurrent users
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP (20 users × ~15 requests each)
  message: { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      || req.headers['x-real-ip']?.toString()
      || req.ip
      || 'unknown';
  },
});
