/**
 * Layer: Infrastructure
 * File: stripeConfig.js
 * Responsibility:
 * Resolves Stripe configuration based on STRIPE_MODE.
 * Single point of truth for Stripe environment selection.
 * Fails explicitly at startup if configuration is incomplete.
 */

const mode = process.env.STRIPE_MODE;

if (!mode) {
  throw new Error('Missing required environment variable: STRIPE_MODE (expected "test" or "live")');
}

if (mode !== 'test' && mode !== 'live') {
  throw new Error(`Invalid STRIPE_MODE value: "${mode}". Expected "test" or "live".`);
}

const secretKey =
  mode === 'live'
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;

const webhookSecret =
  mode === 'live'
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

if (!secretKey) {
  throw new Error(`Missing required environment variable: STRIPE_SECRET_KEY_${mode.toUpperCase()}`);
}

if (!webhookSecret) {
  throw new Error(`Missing required environment variable: STRIPE_WEBHOOK_SECRET_${mode.toUpperCase()}`);
}

console.log(`Stripe initialized in ${mode.toUpperCase()} mode`);

export const stripeConfig = { mode, secretKey, webhookSecret };
