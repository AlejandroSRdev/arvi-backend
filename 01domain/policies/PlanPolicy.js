/**
 * Layer: Domain
 * File: PlanPolicy.js
 * Responsibility:
 * Defines all plan configurations, energy limits, feature access rules, and the token-to-energy conversion rate.
 */

const stripeMode = process.env.STRIPE_MODE || 'test';

export const PLANS = {
  FREEMIUM: {
    id: 'freemium',
    name: 'Freemium',
    price: 0,
    maxEnergy: 0,
    dailyRecharge: 0,
    maxWeeklySummaries: 0,
    maxActiveSeries: 0,
    stripePriceId: null,
    features: [
      'Acceso limitado sin trial',
      'Requiere activar trial de 48h',
    ]
  },

  TRIAL: {
    id: 'trial',
    name: 'Trial (48 horas)',
    price: 0,
    maxEnergy: 135,
    dailyRecharge: 135,
    duration: 48,
    maxWeeklySummaries: 9999,
    maxActiveSeries: 9999,
    stripePriceId: null,
    features: [
      '135 energía inicial',
      '+135 energía después de 24h (total: 270)',
      'Funcionalidades PRO por 48 horas',
      'Series de hábitos ilimitadas',
      'Resúmenes semanales ilimitados',
    ]
  },

  MINI: {
    id: 'mini',
    name: 'Mini',
    price: 1.99,
    currency: 'USD',
    maxEnergy: 75,
    dailyRecharge: 75,
    maxWeeklySummaries: 2,
    maxActiveSeries: 2,
    stripePriceId: stripeMode === 'live'
      ? process.env.PRICE_MINI_LIVE
      : process.env.PRICE_MINI_TEST,
    features: [
      '75 energía diaria',
      '2 series de hábitos activas',
      '2 resúmenes semanales',
    ]
  },

  BASE: {
    id: 'base',
    name: 'Base',
    price: 6.99,
    currency: 'USD',
    maxEnergy: 150,
    dailyRecharge: 150,
    maxWeeklySummaries: 5,
    maxActiveSeries: 5,
    stripePriceId: stripeMode === 'live'
      ? process.env.PRICE_BASE_LIVE
      : process.env.PRICE_BASE_TEST,
    features: [
      '150 energía diaria',
      '5 series de hábitos activas',
      '5 resúmenes semanales',
    ]
  },

  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 12.99,
    currency: 'USD',
    maxEnergy: 300,
    dailyRecharge: 300,
    maxWeeklySummaries: 9999,
    maxActiveSeries: 9999,
    stripePriceId: stripeMode === 'live'
      ? process.env.PRICE_PRO_LIVE
      : process.env.PRICE_PRO_TEST,
    features: [
      '300 energía diaria',
      'Series de hábitos ilimitadas',
      'Resúmenes semanales ilimitados',
    ]
  },
};

export function getPlan(planId, isTrialActive = false) {
  if (planId === 'freemium' && isTrialActive) {
    return PLANS.TRIAL;
  }

  const plan = PLANS[planId?.toUpperCase()];

  if (!plan) {
    console.warn(`⚠️ Plan desconocido: ${planId}, usando FREEMIUM`);
    return PLANS.FREEMIUM;
  }

  return plan;
}

// 1 energy unit = 100 tokens; always rounded up.
export function tokensToEnergy(tokens) {
  return Math.ceil(tokens / 100);
}

export function canConsumeEnergy(planId, energiaActual, energiaNecesaria) {
  const plan = getPlan(planId);

  if (plan.maxEnergy >= 9999) {
    return true;
  }

  return energiaActual >= energiaNecesaria;
}

export const FEATURE_ACCESS = {
  'ai.chat': ['trial', 'mini', 'base', 'pro'],
  'ai.json_convert': ['trial', 'mini', 'base', 'pro'],
  'energy.consume': ['trial', 'mini', 'base', 'pro'],
  'weekly_summaries': ['trial', 'mini', 'base', 'pro'],
  'active_series': ['trial', 'mini', 'base', 'pro'],
  'habits.series.create': ['trial', 'mini', 'base', 'pro'],
  'execution.summary.generate': ['trial', 'mini', 'base', 'pro'],
};

export function hasFeatureAccess(planId, featureKey) {
  const allowedPlans = FEATURE_ACCESS[featureKey];

  if (!allowedPlans) {
    console.warn(`⚠️ Feature desconocida: ${featureKey}`);
    return false;
  }

  return allowedPlans.includes(planId);
}

