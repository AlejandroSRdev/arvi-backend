/**
 * Shared Constants
 *
 * ORIGEN: src/utils/constants.js (MOVIDO COMPLETO)
 *
 * Responsabilidades:
 * - Constantes globales
 * - Valores compartidos entre capas
 *
 * NO CONTIENE:
 * - Lógica de negocio
 * - Dependencias externas
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const RATE_LIMITS = {
  AI_CHAT: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 requests por minuto
  },
  ENERGY_CONSUME: {
    windowMs: 60 * 1000,
    max: 20,
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos de login
  },
};

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  HABITS: 'habits',
  PROJECTS: 'projects',
  ENERGY_LOGS: 'energyLog',
};

export default {
  HTTP_STATUS,
  RATE_LIMITS,
  FIRESTORE_COLLECTIONS,
};
