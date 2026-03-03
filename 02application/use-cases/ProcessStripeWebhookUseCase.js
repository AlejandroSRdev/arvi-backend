/**
 * Layer: Application
 * File: ProcessStripeWebhookUseCase.js
 * Responsibility:
 * Processes verified Stripe webhook events with idempotency and atomicity.
 * Non-retryable errors (unknown user, unmapped plan) are recorded in stripe_failed_events
 * and do NOT propagate — Stripe retries won't fix logical bugs.
 * Retryable errors (DB failures) propagate so Stripe retries.
 */

import { PLANS } from '../../01domain/policies/PlanPolicy.js';

// Map uppercase plan keys (stored in Stripe metadata) to domain plan IDs
const PLAN_KEY_TO_ID = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [key, plan.id])
);

// Retryable error codes: transient DB failures that Stripe should retry.
const RETRYABLE_CODES = new Set(['DATA_ACCESS_FAILURE', 'TRANSACTION_FAILURE']);

function billingLog(event, data) {
  console.log(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
}

function billingLogError(event, data) {
  console.error(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
}

/**
 * Resolve userId from a Stripe invoice event.
 * Priority order (most to least reliable):
 *   1. Invoice's own metadata.userId (set directly on the checkout session)
 *   2. Subscription metadata.userId (propagated via subscription_data.metadata)
 *   3. Stripe Customer ID lookup (persisted during first checkout)
 *   4. Email lookup — last resort; indicates metadata was not propagated correctly
 *
 * @param {Object} invoiceObject
 * @param {Object} userRepository
 * @returns {Promise<string|null>}
 */
async function resolveUserIdFromInvoice(invoiceObject, userRepository) {
  // 1. Invoice's own metadata (most direct — set by checkout session metadata)
  const invoiceMetadataUserId = invoiceObject?.metadata?.userId;
  if (invoiceMetadataUserId) return invoiceMetadataUserId;

  // 2. Subscription metadata (propagated via subscription_data.metadata at session creation)
  const subscriptionMetadataUserId = invoiceObject?.subscription_details?.metadata?.userId;
  if (subscriptionMetadataUserId) return subscriptionMetadataUserId;

  // 3. Stripe Customer ID lookup (customer was persisted at first checkout)
  if (invoiceObject.customer) {
    const user = await userRepository.getUserByCustomerId(invoiceObject.customer);
    if (user) return user.id;
  }

  // 4. Email fallback — metadata was absent; log warning for reconciliation
  if (invoiceObject.customer_email) {
    console.warn(`[WEBHOOK] resolveUserIdFromInvoice: metadata absent, falling back to email lookup (customer=${invoiceObject.customer})`);
    const user = await userRepository.getUserByEmail(invoiceObject.customer_email);
    if (user) return user.id;
  }

  return null;
}

/**
 * Handle invoice.paid: activate the user's plan.
 */
async function handleInvoicePaid(event, userRepository) {
  const { id: eventId } = event;
  const invoiceObject = event.data.object;

  const userId = await resolveUserIdFromInvoice(invoiceObject, userRepository);
  if (!userId) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: 'Cannot determine userId from event payload',
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: 'Cannot determine userId from event payload',
      customerId: invoiceObject.customer ?? null,
      customerEmail: invoiceObject.customer_email ?? null,
    });
    return;
  }

  // internalPlan is the current key; fall back to plan for sessions created before this deploy
  const planKey = invoiceObject?.subscription_details?.metadata?.internalPlan
    ?? invoiceObject?.subscription_details?.metadata?.plan;
  const planId = PLAN_KEY_TO_ID[planKey?.toUpperCase()];
  if (!planId) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: `Unknown plan key: ${planKey}`,
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: `Unknown plan key: ${planKey}`,
      userId,
    });
    return;
  }

  const planConfig = Object.values(PLANS).find(p => p.id === planId);

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: planId,
      planStatus: 'ACTIVE',
      stripeCustomerId: invoiceObject.customer ?? null,
      stripeSubscriptionId: invoiceObject.subscription ?? null,
      'limits.maxActiveSeries': planConfig?.maxActiveSeries ?? null,
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', {
      eventId,
      userId,
      subscriptionStatus: 'ACTIVE',
      plan: planId,
    });
  } catch (err) {
    billingLogError('stripe_webhook_transaction_rolled_back', {
      eventId,
      reason: err.message,
      retryable: RETRYABLE_CODES.has(err.code),
    });
    throw err;
  }
}

/**
 * Handle customer.subscription.deleted: deactivate the user's plan.
 */
async function handleSubscriptionDeleted(event, userRepository) {
  const { id: eventId } = event;
  const subscriptionObject = event.data.object;

  // Subscription metadata carries userId from checkout session
  let userId = subscriptionObject?.metadata?.userId ?? null;

  if (!userId && subscriptionObject.customer) {
    const user = await userRepository.getUserByCustomerId(subscriptionObject.customer);
    if (user) userId = user.id;
  }

  if (!userId) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: 'Cannot determine userId from subscription.deleted payload',
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: 'Cannot determine userId from subscription.deleted payload',
      customerId: subscriptionObject.customer ?? null,
    });
    return;
  }

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: 'freemium',
      planStatus: 'CANCELED',
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', {
      eventId,
      userId,
      subscriptionStatus: 'CANCELED',
      plan: 'freemium',
    });
  } catch (err) {
    billingLogError('stripe_webhook_transaction_rolled_back', {
      eventId,
      reason: err.message,
      retryable: RETRYABLE_CODES.has(err.code),
    });
    throw err;
  }
}

/**
 * Process a verified Stripe webhook event.
 *
 * @param {Object} event - Verified Stripe event
 * @param {Object} deps
 * @param {Object} deps.userRepository
 * @returns {Promise<void>}
 */
export async function processStripeWebhook(event, deps) {
  const { userRepository } = deps;
  const { type, id: eventId } = event;

  if (type === 'invoice.paid') {
    return handleInvoicePaid(event, userRepository);
  }

  if (type === 'customer.subscription.deleted') {
    return handleSubscriptionDeleted(event, userRepository);
  }

  // Unhandled event types are silently ignored
  billingLog('stripe_webhook_unhandled_event', { eventId, eventType: type });
}
