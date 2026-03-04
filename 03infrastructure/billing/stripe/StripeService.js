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
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata,
        subscription_data: { metadata },
        success_url: `${process.env.SUCCESS_BASE_URL}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.CANCEL_URL,
      },
      { idempotencyKey }
    );

    return { url: session.url, sessionId: session.id };
  } catch (err) {
    throw new StripeProviderFailureError({
      operation: 'createCheckoutSession',
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
