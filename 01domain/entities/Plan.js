/**
 * Layer: Domain
 * File: Plan.js
 * Responsibility:
 * Identifies and classifies plan types, and resolves the effective plan when a trial is active.
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

// A freemium user with an active trial is treated as trial for all downstream decisions.
export function getEffectivePlanId(planId, isTrialActive = false) {
  const normalized = normalizePlanId(planId);

  if (normalized === 'freemium' && isTrialActive) {
    return 'trial';
  }

  return normalized;
}

