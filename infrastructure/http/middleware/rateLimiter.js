/**
 * Rate Limiter Middleware (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/middleware/rateLimiter.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Limitar tasa de requests
 * - Prevenir abuso
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../../../shared/constants.js';

/**
 * Rate limiter para endpoints de IA
 * MIGRADO DESDE: src/middleware/rateLimiter.js:aiRateLimiter (líneas 13-22)
 */
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

/**
 * Rate limiter para autenticación
 * MIGRADO DESDE: src/middleware/rateLimiter.js:authRateLimiter (líneas 27-36)
 */
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

/**
 * Rate limiter general
 * MIGRADO DESDE: src/middleware/rateLimiter.js:generalRateLimiter (líneas 41-50)
 */
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
