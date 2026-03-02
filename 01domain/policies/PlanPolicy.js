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

