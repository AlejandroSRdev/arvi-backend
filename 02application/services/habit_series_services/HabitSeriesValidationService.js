/**
 * Layer: Application
 * File: HabitSeriesValidationService.js
 * Responsibility:
 * Orchestrates user and plan validations required before permitting habit series creation.
 */

import { hasFeatureAccess, getPlan } from '../../../01domain/policies/PlanPolicy.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../../errors/Index.js';

/**
 * Determines the user's effective plan considering trial status
 *
 * Business rule:
 * - If user has 'freemium' plan AND trial is active → effective plan is 'trial'
 * - In any other case → effective plan is the user's plan
 *
 * @param {object} user - Firestore user
 * @returns {string} - Effective plan ('freemium', 'trial', 'mini', 'base', 'pro')
 */
function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';

  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }

  return effectivePlan;
}

/**
 * @param {string} userId - User ID
 * @param {object} deps - Injected dependencies { userRepository }
 * @returns {Promise<{allowed: true} | {allowed: false, reason: string, ...}>}
 * @throws {ValidationError} If userRepository is missing
 */
export async function assertCanCreateHabitSeries(userId, deps) {
  const { userRepository } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }

  // 1. Load user ONCE
  const user = await userRepository.getUser(userId);

  if (!user) {
    return {
      allowed: false,
      reason: 'USER_NOT_FOUND'
    };
  }

  // 2. Determine effective plan (considering trial)
  const effectivePlan = determineEffectivePlan(user);
  const planConfig = getPlan(effectivePlan, user.trial?.activo);

  // 3. Validate access to 'habits.series.create' feature
  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.create');

  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'FEATURE_NOT_ALLOWED',
      planId: effectivePlan,
      featureKey: 'habits.series.create'
    };
  }

  // 4. Validate active series limit
  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = planConfig.maxActiveSeries || 0;

  if (activeSeriesCount >= maxActiveSeries) {
    return {
      allowed: false,
      reason: 'LIMIT_REACHED',
      limitType: 'active_series',
      used: activeSeriesCount,
      max: maxActiveSeries,
    };
  }

  return {
    allowed: true,
    planId: effectivePlan,
    limitType: 'active_series',
    used: activeSeriesCount,
    max: maxActiveSeries,
    remaining: maxActiveSeries - activeSeriesCount,
  };
}

export default {
  assertCanCreateHabitSeries,
};
