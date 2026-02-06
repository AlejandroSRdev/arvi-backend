// Description: This module defines and exports rate limiting configurations for different application functionalities.

export const RATE_LIMITS = {
  AI_CHAT: { windowMs: 60_000, max: 10 },
  ENERGY_CONSUME: { windowMs: 60_000, max: 20 },
  AUTH: { windowMs: 15 * 60_000, max: 5 },
};
