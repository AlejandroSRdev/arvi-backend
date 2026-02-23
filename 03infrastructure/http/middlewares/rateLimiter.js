/**
 * Layer: Infrastructure
 * File: rateLimiter.js
 * Responsibility:
 * Applies express-rate-limit to HTTP endpoints using configured thresholds to reject excess requests.
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../../config/rateLimits.js';

export const aiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.AI_CHAT.windowMs,
  max: RATE_LIMITS.AI_CHAT.max,
  message: {
    error: true,
    message: 'Too many AI requests. Please try again in 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    error: true,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: {
    error: true,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  aiRateLimiter,
  authRateLimiter,
  generalRateLimiter,
};
