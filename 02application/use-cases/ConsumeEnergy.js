/**
 * Consume Energy Use Case (Domain)
 *
 * MIGRADO DESDE: src/services/energyService.js (líneas 34-86)
 * EXTRACCIÓN: Orquestación de obtención y recarga de energía
 *
 * Responsabilidades:
 * - Obtener energía actual del usuario
 * - Decidir si necesita recarga diaria
 * - Aplicar recarga si corresponde
 * - Coordinar con IEnergyRepository e IUserRepository (ports)
 *
 * NO contiene:
 * - Lógica de Firestore
 * - Transacciones
 * - Logs de persistencia
 * - Cálculos internos de energía (eso está en entities/policies)
 */

import { determineEffectivePlan } from './ValidatePlanAccess.js';
import { needsDailyRecharge } from '../../01domain/entities/Energy.js';
import { getPlan } from '../../01domain/policies/PlanPolicy.js';
import { ValidationError } from "../../errors/index.js";

/**
 * Obtener energía actual del usuario (con recarga automática si corresponde)
 *
 * MIGRADO DESDE: src/services/energyService.js:getUserEnergy (líneas 34-61)
 * AJUSTADO: 2025-12-30 - Usar nuevo puerto IEnergyRepository.updateEnergy()
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {energyRepository, userRepository}
 * @returns {Promise<Object>} {actual, maxima, consumoTotal, plan, planId}
 */
export async function getUserEnergy(userId, deps) {
  const { energyRepository, userRepository } = deps;

  if (!energyRepository || !userRepository) {
    throw new ValidationError('Dependencies required: energyRepository, userRepository');
  }

  const energy = await energyRepository.getEnergy(userId);

  // Verificar si necesita recarga (función pura de entity)
  if (needsDailyRecharge(energy.ultimaRecarga)) {
    const user = await userRepository.getUser(userId);
    const plan = getPlan(user.plan, user.trial?.activo);

    // Recargar energía (valores calculados aquí, NO en el repo)
    await energyRepository.updateEnergy(userId, {
      actual: plan.maxEnergy,
      maxima: plan.maxEnergy,
      ultimaRecarga: new Date()
    }, 'daily_recharge');

    // Actualizar objeto energy local
    energy.actual = plan.maxEnergy;
    energy.maxima = plan.maxEnergy;
  }

  const user = await userRepository.getUser(userId);
  const planId = determineEffectivePlan(user);

  return {
    actual: energy.actual,
    maxima: energy.maxima,
    consumoTotal: energy.consumoTotal,
    plan: planId,
    planId,
  };
}

/**
 * Forzar recarga de energía (admin/debug)
 *
 * MIGRADO DESDE: src/services/energyService.js:forceRecharge (líneas 77-86)
 * AJUSTADO: 2025-12-30 - Usar nuevo puerto IEnergyRepository.updateEnergy()
 *
 * @param {string} userId - ID del usuario
 * @param {Object} deps - Dependencias inyectadas {energyRepository, userRepository}
 * @returns {Promise<Object>} {actual, maxima}
 */
export async function forceRecharge(userId, deps) {
  const { energyRepository, userRepository } = deps;

  if (!energyRepository || !userRepository) {
    throw new ValidationError('Dependencies required: energyRepository, userRepository');
  }

  const user = await userRepository.getUser(userId);
  const plan = getPlan(user.plan, user.trial?.activo);

  // Calcular energía aquí (NO en el repo)
  await energyRepository.updateEnergy(userId, {
    actual: plan.maxEnergy,
    maxima: plan.maxEnergy,
    ultimaRecarga: new Date()
  }, 'force_recharge');

  return {
    actual: plan.maxEnergy,
    maxima: plan.maxEnergy
  };
}

export default {
  getUserEnergy,
  forceRecharge,
};
