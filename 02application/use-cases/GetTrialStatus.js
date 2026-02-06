/**
 * Get Trial Status Use Case (Domain)
 *
 * MIGRADO DESDE: src/controllers/energyController.js (líneas 82)
 * EXTRACCIÓN: Obtención de estado del trial
 *
 * Responsabilidades:
 * - Obtener estado actual del trial del usuario
 * - Retornar información de activación y expiración
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Lógica HTTP
 * - Acceso directo a Firestore
 * - Cálculos de tiempo restante (eso en el frontend)
 */

import { ValidationError, NotFoundError } from './errors/index.js';

/**
 * Obtener estado del trial del usuario
 *
 * MIGRADO DESDE: src/models/Trial.js:getTrialStatus
 * (llamado desde src/controllers/energyController.js:82)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} Estado del trial
 */
export async function getTrialStatus(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Retornar estado del trial o valores por defecto
  const trial = user.trial || {};

  return {
    activo: trial.activo || false,
    startTimestamp: trial.startTimestamp || null,
    expiresAt: trial.expiresAt || null,
  };
}

export default {
  getTrialStatus,
};
