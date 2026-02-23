/**
 * Layer: Application
 * File: ConsumeEnergy.js
 * Responsibility:
 * Coordinates energy retrieval and daily recharge logic, delegating energy state updates through repository ports.
 */

import { determineEffectivePlan } from './ValidatePlanAccess.js';
import { needsDailyRecharge } from '../../01domain/entities/Energy.js';
import { getPlan } from '../../01domain/policies/PlanPolicy.js';
import { ValidationError } from "../../errors/Index.js";

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { energyRepository, userRepository }
 * @returns {Promise<Object>} { actual, maxima, consumoTotal, plan, planId }
 */
export async function getUserEnergy(userId, deps) {
  const { energyRepository, userRepository } = deps;

  if (!energyRepository || !userRepository) {
    throw new ValidationError('Dependencies required: energyRepository, userRepository');
  }

  const energy = await energyRepository.getEnergy(userId);

  // Recharge check must happen before reading planId to avoid a stale user read
  if (needsDailyRecharge(energy.ultimaRecarga)) {
    const user = await userRepository.getUser(userId);
    const plan = getPlan(user.plan, user.trial?.activo);

    // Values are computed here, not inside the repository
    await energyRepository.updateEnergy(userId, {
      actual: plan.maxEnergy,
      maxima: plan.maxEnergy,
      ultimaRecarga: new Date()
    }, 'daily_recharge');

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
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { energyRepository, userRepository }
 * @returns {Promise<Object>} { actual, maxima }
 */
export async function forceRecharge(userId, deps) {
  const { energyRepository, userRepository } = deps;

  if (!energyRepository || !userRepository) {
    throw new ValidationError('Dependencies required: energyRepository, userRepository');
  }

  const user = await userRepository.getUser(userId);
  const plan = getPlan(user.plan, user.trial?.activo);

  // Values are computed here, not inside the repository
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
