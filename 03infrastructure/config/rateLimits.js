/**
 * Layer: Infrastructure
 * File: rateLimits.js
 * Responsibility:
 * Defines request rate limit thresholds consumed by HTTP middleware to enforce per-category traffic limits.
 */

export const RATE_LIMITS = {
  AI_CHAT: { windowMs: 60_000, max: 10 },
  ENERGY_CONSUME: { windowMs: 60_000, max: 20 },
  AUTH: { windowMs: 15 * 60_000, max: 5 },
};
