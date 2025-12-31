/**
 * Trial Entity (Domain)
 *
 * LÓGICA PURA extraída de: src/models/Trial.js
 *
 * Funciones migradas:
 * - Constante TRIAL_DURATION_HOURS (línea 23)
 * - Validación de expiración de trial (líneas 109-126, lógica pura extraída)
 * - Cálculo de tiempo restante (líneas 156-159, lógica pura extraída)
 * - Validación de prerequisitos para activar trial (líneas 41-49, lógica pura extraída)
 *
 * NO contiene:
 * - Acceso a Firestore
 * - Transacciones
 * - userId
 * - Efectos secundarios
 */

/**
 * Duración del trial en horas
 * REGLA DE DOMINIO: Trial dura exactamente 48 horas
 */
export const TRIAL_DURATION_HOURS = 48;

/**
 * Calcular fecha de expiración del trial
 * @param {Date} startDate - Fecha de inicio del trial
 * @returns {Date} - Fecha de expiración
 */
export function calculateTrialExpiration(startDate) {
  if (!startDate || !(startDate instanceof Date)) {
    throw new Error('startDate debe ser una instancia de Date');
  }

  return new Date(startDate.getTime() + TRIAL_DURATION_HOURS * 60 * 60 * 1000);
}

/**
 * Verificar si el trial ha expirado
 * LÓGICA PURA extraída de: src/models/Trial.js líneas 112-125
 *
 * @param {Date} expiresAt - Fecha de expiración del trial
 * @param {Date} currentDate - Fecha actual (inyectada para testabilidad)
 * @returns {boolean} - true si ha expirado
 */
export function isTrialExpired(expiresAt, currentDate = new Date()) {
  if (!expiresAt || !(expiresAt instanceof Date)) {
    return true; // Sin fecha de expiración = expirado
  }

  return currentDate > expiresAt;
}

/**
 * Calcular tiempo restante del trial en segundos
 * LÓGICA PURA extraída de: src/models/Trial.js líneas 156-159
 *
 * @param {Date} expiresAt - Fecha de expiración
 * @param {Date} currentDate - Fecha actual (inyectada)
 * @returns {number|null} - Segundos restantes o null si expirado
 */
export function calculateTimeRemaining(expiresAt, currentDate = new Date()) {
  if (!expiresAt || !(expiresAt instanceof Date)) {
    return null;
  }

  if (currentDate >= expiresAt) {
    return null; // Expirado
  }

  return Math.floor((expiresAt - currentDate) / 1000);
}

/**
 * Validar si un usuario puede activar el trial
 * LÓGICA PURA extraída de: src/models/Trial.js líneas 41-49
 *
 * REGLAS DE DOMINIO:
 * 1. Solo usuarios con plan freemium pueden activar trial
 * 2. Trial solo se puede activar una vez (si ya tiene startTimestamp, no puede)
 *
 * @param {string} userPlan - Plan actual del usuario
 * @param {boolean} hasUsedTrial - Si el usuario ya usó el trial (tiene startTimestamp)
 * @returns {object} - { canActivate: boolean, reason?: string }
 */
export function canActivateTrial(userPlan, hasUsedTrial) {
  // Regla 1: Solo freemium
  if (userPlan !== 'freemium') {
    return {
      canActivate: false,
      reason: 'Solo usuarios freemium pueden activar el trial',
    };
  }

  // Regla 2: Una sola vez
  if (hasUsedTrial) {
    return {
      canActivate: false,
      reason: 'Trial ya fue activado previamente',
    };
  }

  return {
    canActivate: true,
  };
}

/**
 * Verificar si el trial está activo (considerando expiración)
 * LÓGICA PURA extraída de: src/models/Trial.js líneas 99-127
 *
 * @param {boolean} isMarkedActive - Flag 'activo' del trial
 * @param {Date} expiresAt - Fecha de expiración
 * @param {Date} currentDate - Fecha actual
 * @returns {boolean}
 */
export function isTrialCurrentlyActive(isMarkedActive, expiresAt, currentDate = new Date()) {
  // Si no está marcado como activo, no lo está
  if (!isMarkedActive) {
    return false;
  }

  // Si no hay fecha de expiración, no es válido
  if (!expiresAt) {
    return false;
  }

  // Verificar si ha expirado
  return !isTrialExpired(expiresAt, currentDate);
}

export default {
  TRIAL_DURATION_HOURS,
  calculateTrialExpiration,
  isTrialExpired,
  calculateTimeRemaining,
  canActivateTrial,
  isTrialCurrentlyActive,
};
