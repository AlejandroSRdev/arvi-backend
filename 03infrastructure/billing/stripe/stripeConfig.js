/**
 * Layer: Infrastructure
 * File: stripeConfig.js
 * Responsibility:
 * Resolves Stripe configuration based on STRIPE_MODE.
 * Single point of truth for Stripe environment selection.
 *
 * No side effects on import. Call initializeStripeConfig() to validate and
 * populate the config. Fails explicitly if configuration is incomplete.
 */

let initialized = false;

export const stripeConfig = {
  mode: null,
  secretKey: null,
  webhookSecret: null,
};

/**
 * Validate env vars and populate stripeConfig.
 * Must be called once before any Stripe operation.
 */
export function initializeStripeConfig() {
  if (initialized) return;

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

  // Validate price IDs at startup — fail fast before any request reaches Stripe.
  const priceBaseVar = mode === 'live' ? 'PRICE_BASE_LIVE' : 'PRICE_BASE_TEST';
  const priceProVar  = mode === 'live' ? 'PRICE_PRO_LIVE'  : 'PRICE_PRO_TEST';

  const priceBase = process.env[priceBaseVar];
  const pricePro  = process.env[priceProVar];

  if (!priceBase) {
    throw new Error(`Missing required environment variable: ${priceBaseVar}`);
  }
  if (!pricePro) {
    throw new Error(`Missing required environment variable: ${priceProVar}`);
  }
  if (!priceBase.startsWith('price_')) {
    throw new Error(`Invalid ${priceBaseVar}: value does not look like a Stripe price ID (must start with "price_")`);
  }
  if (!pricePro.startsWith('price_')) {
    throw new Error(`Invalid ${priceProVar}: value does not look like a Stripe price ID (must start with "price_")`);
  }

  stripeConfig.mode = mode;
  stripeConfig.secretKey = secretKey;
  stripeConfig.webhookSecret = webhookSecret;

  console.log(`Stripe initialized in ${mode.toUpperCase()} mode | price vars: ${priceBaseVar}, ${priceProVar}`);
  initialized = true;
}
