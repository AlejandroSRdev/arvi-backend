/**
 * Layer: Application
 * File: ValidatePlanAccess.js
 * Responsibility:
 * Coordinates plan-based feature access and usage limit validation for multiple application flows.
 */

import { hasFeatureAccess, getPlan, resolveUserPlan } from '../../01domain/policies/PlanPolicy.js';

export async function validateFeatureAccess(userId, featureKey, deps) {
  const { userRepository } = deps;
  if (!userRepository) {
    throw new Error('Dependency required: userRepository');
  }
  const user = await userRepository.getUser(userId);
  if (!user) {
    return { allowed: false, reason: 'USER_NOT_FOUND' };
  }
  const planId = resolveUserPlan(user);
  if (!planId) {
    return { allowed: false, planId: null, featureKey, reason: 'FEATURE_NOT_ALLOWED' };
  }
  const allowed = hasFeatureAccess(planId, featureKey);
  if (!allowed) {
    return { allowed: false, planId, featureKey, reason: 'FEATURE_NOT_ALLOWED' };
  }
  return { allowed: true, planId };
}

export async function validateWeeklySummariesLimit(userId, deps) {
  const { userRepository } = deps;
  if (!userRepository) throw new Error('Dependency required: userRepository');

  const user = await userRepository.getUser(userId);
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };

  const planId = resolveUserPlan(user);
  const plan = getPlan(planId);

  const now = new Date();
  const limits = user.limits || {};
  let weeklySummariesUsed = limits.weeklySummariesUsed || 0;
  let resetAt = limits.weeklySummariesResetAt?.toDate?.() || new Date(limits.weeklySummariesResetAt || now);

  const daysSinceReset = (now - resetAt) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 7) {
    weeklySummariesUsed = 0;
    await userRepository.updateUser(user.id, {
      'limits.weeklySummariesUsed': 0,
      'limits.weeklySummariesResetAt': now,
    });
  }

  const maxSummaries = plan.maxWeeklySummaries || 0;

  if (weeklySummariesUsed >= maxSummaries) {
    return {
      allowed: false,
      limitType: 'weekly_summaries',
      used: weeklySummariesUsed,
      max: maxSummaries,
      resetIn: Math.ceil(7 - daysSinceReset),
      reason: 'LIMIT_REACHED',
    };
  }

  return {
    allowed: true,
    limitType: 'weekly_summaries',
    used: weeklySummariesUsed,
    max: maxSummaries,
    remaining: maxSummaries - weeklySummariesUsed,
  };
}

export async function validateActiveSeriesLimit(userId, deps) {
  const { userRepository } = deps;
  if (!userRepository) throw new Error('Dependency required: userRepository');

  const user = await userRepository.getUser(userId);
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };

  const planId = resolveUserPlan(user);
  const plan = getPlan(planId);

  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = plan?.maxActiveSeries || 0;

  if (activeSeriesCount >= maxActiveSeries) {
    return {
      allowed: false,
      limitType: 'active_series',
      used: activeSeriesCount,
      max: maxActiveSeries,
      reason: 'LIMIT_REACHED',
    };
  }

  return {
    allowed: true,
    limitType: 'active_series',
    used: activeSeriesCount,
    max: maxActiveSeries,
    remaining: maxActiveSeries - activeSeriesCount,
  };
}

export default {
  validateFeatureAccess,
  validateWeeklySummariesLimit,
  validateActiveSeriesLimit,
};
