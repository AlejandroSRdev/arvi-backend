/**
 * Domain Validator
 *
 * MIGRADO DESDE: src/utils/validator.js (COMPLETO)
 *
 * Validaciones de dominio puras (reglas de negocio e invariantes).
 * NO contiene lógica HTTP, BD o infraestructura.
 *
 * Responsabilidades:
 * - Validar invariantes de entidades
 * - Validar reglas de negocio básicas
 * - Validar formatos y estructuras del dominio
 */

/**
 * Validar formato de email
 * MIGRADO DESDE: src/utils/validator.js:validateEmail (líneas 7-10)
 *
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar ID de usuario
 * MIGRADO DESDE: src/utils/validator.js:validateUserId (líneas 12-14)
 *
 * @param {string} userId - ID a validar
 * @returns {boolean} true si es válido
 */
export function validateUserId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0;
}

/**
 * Validar plan
 * MIGRADO DESDE: src/utils/validator.js:validatePlan (líneas 16-19)
 *
 * @param {string} plan - Plan a validar
 * @returns {boolean} true si es válido
 */
export function validatePlan(plan) {
  const validPlans = ['freemium', 'mini', 'base', 'pro'];
  return validPlans.includes(plan);
}

/**
 * Validar estructura de mensajes para IA
 * MIGRADO DESDE: src/utils/validator.js:validateMessages (líneas 21-31)
 *
 * @param {Array} messages - Array de mensajes a validar
 * @returns {boolean} true si son válidos
 */
export function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    return false;
  }

  return messages.every(msg =>
    msg.role && msg.content &&
    typeof msg.role === 'string' &&
    typeof msg.content === 'string'
  );
}

export default {
  validateEmail,
  validateUserId,
  validatePlan,
  validateMessages,
};
