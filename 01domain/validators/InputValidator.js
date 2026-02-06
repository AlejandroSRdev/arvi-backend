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
  validateMessages,
};
