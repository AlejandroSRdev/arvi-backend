/**
 * Activate Trial Use Case (Domain)
 *
 * MIGRADO DESDE: src/models/Trial.js (líneas 28-83)
 * EXTRACCIÓN: Orquestación de activación de trial
 *
 * Responsabilidades:
 * - Validar que el usuario puede activar el trial
 * - Calcular fechas de inicio y expiración
 * - Asignar energía inicial del trial
 * - Coordinar con IUserRepository (port)
 *
 * NO contiene:
 * - Lógica de Firestore
 * - Transacciones
 * - Timestamps de servidor
 */

import { PLANS } from '../policies/PlanPolicy.js';

/**
 * Activar trial de 48 horas (solo si nunca lo ha usado)
 *
 * MIGRADO DESDE: src/models/Trial.js:activateTrial (líneas 28-83)
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {userRepository}
 * @returns {Promise<Object>} {activo, startTimestamp, expiresAt, energiaInicial}
 */
export async function activateTrial(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new Error('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.plan !== 'freemium') {
    throw new Error('Solo usuarios freemium pueden activar el trial');
  }

  if (user.trial?.startTimestamp) {
    throw new Error('Trial ya fue activado previamente');
  }

  const now = new Date();
  const durationHours = PLANS.TRIAL.duration || 48;
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  await userRepository.updateUser(userId, {
    'trial.activo': true,
    'trial.startTimestamp': now,
    'trial.expiresAt': expiresAt,
    'energia.actual': PLANS.TRIAL.maxEnergy,
    'energia.maxima': PLANS.TRIAL.maxEnergy,
    'energia.ultimaRecarga': now,
  });

  return {
    activo: true,
    startTimestamp: now,
    expiresAt,
    energiaInicial: PLANS.TRIAL.maxEnergy,
  };
}

export default {
  activateTrial,
};
