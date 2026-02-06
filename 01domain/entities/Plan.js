/**
 * Plan (Domain Entity / Value Object)
 *
 * Representa la identidad de un plan.
 * Las reglas y límites viven en PlanPolicy.
 */

export function normalizePlanId(planId) {
  if (!planId || typeof planId !== 'string') return 'freemium';
  return planId.toLowerCase();
}

export function isFreemiumPlan(planId) {
  return normalizePlanId(planId) === 'freemium';
}

export function isTrialPlan(planId) {
  return normalizePlanId(planId) === 'trial';
}

export function isPaidPlan(planId) {
  const id = normalizePlanId(planId);
  return id === 'mini' || id === 'base' || id === 'pro';
}

/**
 * Devuelve el plan efectivo considerando trial activo
 */
export function getEffectivePlanId(planId, isTrialActive = false) {
  const normalized = normalizePlanId(planId);

  if (normalized === 'freemium' && isTrialActive) {
    return 'trial';
  }

  return normalized;
}

