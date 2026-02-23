/**
 * Layer: Application
 * File: ActivateTrial.js
 * Responsibility:
 * Orchestrates trial activation by validating eligibility, computing dates, and persisting the trial state.
 */

import { PLANS } from '../../01domain/policies/PlanPolicy.js';
import { ValidationError, NotFoundError, AuthorizationError, TrialAlreadyUsedError } from "../../errors/Index.js";

/**
 * @param {string} userId - User ID
 * @param {Object} deps - Injected dependencies { userRepository }
 * @returns {Promise<Object>} { activo, startTimestamp, expiresAt, energiaInicial }
 */
export async function activateTrial(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  const user = await userRepository.getUser(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.plan !== 'freemium') {
    throw new AuthorizationError('Only freemium users can activate trial');
  }

  if (user.trial?.startTimestamp) {
    throw new TrialAlreadyUsedError();
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
