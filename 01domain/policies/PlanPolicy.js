/**
 * Layer: Domain
 * File: PlanPolicy.js
 * Responsibility:
 * Defines subscription plans, usage limits (series & actions),
 * and Stripe integration mapping.
 */

import { PLAN_LIMITS } from '../value_objects/user/Limits.js';

const stripeMode = process.env.STRIPE_MODE || 'test';

export const PLANS = {
  TRIAL: {
    id: 'trial',
    name: 'Trial',
    price: 0,
    currency: 'USD',
    durationDays: 3,

    maxActiveSeries: PLAN_LIMITS.TRIAL.activeSeries,
    maxMonthlyActions: PLAN_LIMITS.TRIAL.monthlyActions,

    stripePriceId: null,
    isSubscription: false,
  },

  BASE: {
    id: 'base',
    name: 'Base',
    price: 2.99,
    currency: 'USD',

    maxActiveSeries: PLAN_LIMITS.BASE.activeSeries,
    maxMonthlyActions: PLAN_LIMITS.BASE.monthlyActions,

    stripePriceId: stripeMode === 'live'
      ? process.env.PRICE_BASE_LIVE
      : process.env.PRICE_BASE_TEST,

    isSubscription: true,
  },

  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 5.99,
    currency: 'USD',

    maxActiveSeries: PLAN_LIMITS.PRO.activeSeries,
    maxMonthlyActions: PLAN_LIMITS.PRO.monthlyActions,

    stripePriceId: stripeMode === 'live'
      ? process.env.PRICE_PRO_LIVE
      : process.env.PRICE_PRO_TEST,

    isSubscription: true,
  },
};

/**
 * Returns the plan configuration for a given plan ID.
 * Returns null for unknown or freemium plans (no AI feature access).
 */
export function getPlan(planId) {
  return Object.values(PLANS).find(p => p.id === planId) || null;
}

/**
 * Returns true if the effective plan grants access to AI features.
 * Freemium (no plan match) has no access.
 */
export function hasFeatureAccess(effectivePlan, feature) {
  return !!getPlan(effectivePlan);
}

/**
 * Returns the monthly action creation limit for a given effective plan.
 * Returns 0 for plans with no access.
 */
export function monthlyActionsLimit(effectivePlan) {
  const plan = getPlan(effectivePlan);
  return plan ? plan.maxMonthlyActions : 0;
}

/**
 * Resolves the effective plan ID for a user.
 * For trial users, returns null if the trial has expired (time-based, no background job needed).
 * For all other plans, returns user.plan as-is (Stripe webhooks govern their lifecycle).
 *
 * @param {Object} user - Raw user object from repository (must have plan, planExpiresAt)
 * @returns {string|null} Effective plan ID, or null if access has expired
 */
export function resolveUserPlan(user) {
  if (user.plan === PLANS.TRIAL.id) {
    const now = new Date();
    const expiresAt = user.planExpiresAt instanceof Date
      ? user.planExpiresAt
      : new Date(user.planExpiresAt);

    if (now >= expiresAt) return null;
  }

  return user.plan || null;
}

/**
 * Returns the usage limits for a given plan ID.
 * Returns null for unknown plans.
 *
 * @param {string} planId - Plan ID (e.g. 'trial', 'base', 'pro')
 * @returns {{ maxActiveSeries: number, maxMonthlyActions: number }|null}
 */
export function getPlanLimits(planId) {
  const plan = getPlan(planId);
  if (!plan) return null;

  return {
    maxActiveSeries: plan.maxActiveSeries,
    maxMonthlyActions: plan.maxMonthlyActions,
  };
}

