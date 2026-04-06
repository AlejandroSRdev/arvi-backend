/**
 * Layer: Infrastructure
 * File: StripeService.js
 * Responsibility:
 * Stripe SDK client. Handles checkout session creation and webhook event verification.
 * No domain logic. All Stripe API calls are isolated here.
 *
 * No side effects on import. Call initializeStripeService() once before use.
 */

import Stripe from 'stripe';
import { StripeProviderFailureError } from '../../../errors/Index.js';
import { stripeConfig } from './stripeConfig.js';

let stripe = null;

/**
 * Initialize the Stripe SDK client.
 * Must be called after initializeStripeConfig() has populated stripeConfig.
 */
export function initializeStripeService() {
  if (stripe) return;
  stripe = new Stripe(stripeConfig.secretKey);
}

function getStripe() {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initializeStripeService() first.');
  }
  return stripe;
}

/**
 * Creates a Stripe Customer for a user.
 */
export async function createCustomer({ email, metadata }) {
  try {
    const customer = await getStripe().customers.create({ email, metadata });
    return { customerId: customer.id };
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'createCustomer',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Creates a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession({ customerId, priceId, metadata, idempotencyKey }) {
  console.log(`[Stripe] Creating checkout session | mode=${stripeConfig.mode} | plan=${metadata?.internalPlan} | priceId=${priceId}`);

  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata,
        subscription_data: { metadata },
        success_url: `${process.env.BASE_API_URL}/billing/success`,
        cancel_url: `${process.env.BASE_API_URL}/billing/cancel`,
      },
      { idempotencyKey }
    );

    return { url: session.url, sessionId: session.id };
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'createCheckoutSession',
      message: `[mode=${stripeConfig.mode} plan=${metadata?.internalPlan} priceId=${priceId}] ${err.message}`,
      cause: err,
    });
  }
}

/**
 * Retrieves an existing Stripe subscription by ID.
 */
export async function retrieveSubscription(subscriptionId) {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'retrieveSubscription',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Creates a Stripe Billing Portal session for a customer.
 */
export async function createBillingPortalSession({ customerId, returnUrl }) {
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'createBillingPortalSession',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Creates a Stripe Checkout Session in payment mode for plan changes.
 */
export async function createPlanChangeCheckoutSession({ customerId, priceId, metadata, idempotencyKey }) {
  console.log(`[Stripe] Creating plan-change checkout session | mode=${stripeConfig.mode} | priceId=${priceId}`);

  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata,
        success_url: `${process.env.BASE_API_URL}/billing/success`,
        cancel_url: `${process.env.BASE_API_URL}/billing/cancel`,
      },
      { idempotencyKey }
    );

    return { url: session.url, sessionId: session.id };
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'createPlanChangeCheckoutSession',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Updates an existing subscription to a new price.
 */
export async function updateSubscription(subscriptionId, { itemId, priceId }) {
  try {
    await getStripe().subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
    });
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'updateSubscription',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Immediately cancels a Stripe subscription.
 */
export async function cancelSubscription(subscriptionId) {
  try {
    await getStripe().subscriptions.cancel(subscriptionId);
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'cancelSubscription',
      message: err.message,
      cause: err,
    });
  }
}

/**
 * Verifies and constructs a Stripe webhook event from a raw request body.
 */
export function constructWebhookEvent(rawBody, signatureHeader) {
  return getStripe().webhooks.constructEvent(
    rawBody,
    signatureHeader,
    stripeConfig.webhookSecret
  );
}
