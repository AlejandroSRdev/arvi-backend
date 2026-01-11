/**
 * Validate Plan Access Use Case (Domain)
 *
 * MIGRADO DESDE:
 * - src/middleware/authorizeFeature.js (líneas 26-93)
 * - src/middleware/validatePlanLimit.js (líneas 31-183)
 *
 * Responsabilidades:
 * - Determinar plan efectivo del usuario (incluyendo trial)
 * - Validar acceso a features según plan (vía PlanPolicy)
 * - Validar límites de uso (weekly summaries, active series)
 * - Aplicar reset lazy de contadores semanales
 *
 * NO contiene:
 * - Lógica HTTP (req/res)
 * - Middleware
 * - Acceso directo a Firestore
 */

import { hasFeatureAccess, getPlan } from '../../domain/policies/PlanPolicy.js';

export function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';
  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }
  return effectivePlan;
}

export async function validateFeatureAccess(userId, featureKey, deps) {
  const { userRepository } = deps;
  if (!userRepository) {
    throw new Error('Dependency required: userRepository');
  }
  const user = await userRepository.getUser(userId);
  if (!user) {
    return { allowed: false, reason: 'USER_NOT_FOUND' };
  }
  const effectivePlan = determineEffectivePlan(user);
  const allowed = hasFeatureAccess(effectivePlan, featureKey);
  if (!allowed) {
    return { allowed: false, planId: effectivePlan, featureKey, reason: 'FEATURE_NOT_ALLOWED' };
  }
  return { allowed: true, planId: effectivePlan, isTrialActive: effectivePlan === 'trial' };
}

/**
 * Validar límite de resúmenes semanales (con reset lazy)
 *
 * MIGRADO DESDE: src/middleware/validatePlanLimit.js (líneas 95-148)
 */
export async function validateWeeklySummariesLimit(userId, deps) {
  const { userRepository } = deps;
  if (!userRepository) throw new Error('Dependency required: userRepository');

  const user = await userRepository.getUser(userId);
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };

  const effectivePlan = determineEffectivePlan(user);
  const plan = getPlan(effectivePlan, user.trial?.activo);

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

/**
 * Validar límite de series activas
 *
 * MIGRADO DESDE: src/middleware/validatePlanLimit.js (líneas 153-183)
 */
export async function validateActiveSeriesLimit(userId, deps) {
  const { userRepository } = deps;
  if (!userRepository) throw new Error('Dependency required: userRepository');

  const user = await userRepository.getUser(userId);
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };

  const effectivePlan = determineEffectivePlan(user);
  const plan = getPlan(effectivePlan, user.trial?.activo);

  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = plan.maxActiveSeries || 0;

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
  determineEffectivePlan,
  validateFeatureAccess,
  validateWeeklySummariesLimit,
  validateActiveSeriesLimit,
};
