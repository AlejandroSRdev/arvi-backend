/**
 * Layer: Infrastructure
 * File: StripeService.js
 * Responsibility:
 * Stripe SDK client. Handles checkout session creation and webhook event verification.
 * No domain logic. All Stripe API calls are isolated here.
 */

import Stripe from 'stripe';
import { StripeProviderFailureError } from '../../../errors/Index.js';
import { stripeConfig } from './stripeConfig.js';

const stripe = new Stripe(stripeConfig.secretKey);

/**
 * Creates a Stripe Customer for a user.
 * Should be called once per user; caller is responsible for persisting the returned customerId.
 *
 * @param {{ email: string, metadata: Object }} params
 * @returns {Promise<{ customerId: string }>}
 */
export async function createCustomer({ email, metadata }) {
  try {
    const customer = await stripe.customers.create({ email, metadata });
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
 * Requires a Stripe customerId — never passes raw email to avoid duplicate customers.
 *
 * @param {{ customerId: string, priceId: string, metadata: Object, idempotencyKey: string }} params
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function createCheckoutSession({ customerId, priceId, metadata, idempotencyKey }) {
  // Log mode + priceId before the API call to make test/live mismatches immediately visible in logs.
  console.log(`[Stripe] Creating checkout session | mode=${stripeConfig.mode} | plan=${metadata?.internalPlan} | priceId=${priceId}`);

  try {
    const session = await stripe.checkout.sessions.create(
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
 *
 * @param {string} subscriptionId
 * @returns {Promise<Object>} Stripe subscription object
 */
export async function retrieveSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
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
 *
 * @param {{ customerId: string, returnUrl: string }} params
 * @returns {Promise<{ url: string }>}
 */
export async function createBillingPortalSession({ customerId, returnUrl }) {
  try {
    const session = await stripe.billingPortal.sessions.create({
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
 * Creates a Stripe Checkout Session in payment mode to collect a one-time charge
 * before executing a plan change on an existing subscription.
 * The webhook reads session.metadata.action === 'plan_change' to perform the update.
 *
 * @param {{ customerId: string, priceId: string, metadata: Object, idempotencyKey: string }} params
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function createPlanChangeCheckoutSession({ customerId, priceId, metadata, idempotencyKey }) {
  console.log(`[Stripe] Creating plan-change checkout session | mode=${stripeConfig.mode} | priceId=${priceId}`);

  try {
    const session = await stripe.checkout.sessions.create(
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
 * Updates an existing subscription to a new price (upgrade or downgrade).
 *
 * @param {string} subscriptionId
 * @param {{ itemId: string, priceId: string }} params
 * @returns {Promise<void>}
 */
export async function updateSubscription(subscriptionId, { itemId, priceId }) {
  try {
    await stripe.subscriptions.update(subscriptionId, {
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
 * Verifies and constructs a Stripe webhook event from a raw request body.
 * Throws the raw Stripe error on signature mismatch (caller maps it to 400).
 *
 * @param {Buffer} rawBody
 * @param {string} signatureHeader
 * @returns {Object} Verified Stripe event
 */
export function constructWebhookEvent(rawBody, signatureHeader) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signatureHeader,
    stripeConfig.webhookSecret
  );
}
