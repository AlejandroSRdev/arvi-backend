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
  console.log(JSON.stringify({ level: 'info', event, ...data, ts: new Date().toISOString() }));
}

function billingLogError(event, data) {
  console.error(JSON.stringify({ level: 'error', event, ...data, ts: new Date().toISOString() }));
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
    // Plan key absent or unrecognized — safely ignore plan update.
    // Optionally refresh stripeSubscriptionId if the invoice carries one.
    billingLog('stripe_webhook_invoice_paid_no_plan', { eventId, userId, planKey: planKey ?? null });

    if (invoiceObject.subscription) {
      try {
        const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
          stripeSubscriptionId: invoiceObject.subscription,
        });
        if (skipped) {
          billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
        }
      } catch (err) {
        billingLogError('stripe_webhook_transaction_rolled_back', {
          eventId,
          reason: err.message,
          retryable: RETRYABLE_CODES.has(err.code),
        });
        throw err;
      }
    }
    return;
  }

  const planConfig = Object.values(PLANS).find(p => p.id === planId);

  // Reset monthly actions quota to the new plan's full limit
  const monthlyActionsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: planId,
      planStatus: 'ACTIVE',
      stripeCustomerId: invoiceObject.customer ?? null,
      stripeSubscriptionId: invoiceObject.subscription ?? null,
      'limits.maxActiveSeries': planConfig?.maxActiveSeries ?? null,
      'limits.monthlyActionsMax': planConfig?.maxMonthlyActions ?? null,
      'limits.monthlyActionsRemaining': planConfig?.maxMonthlyActions ?? null,
      'limits.monthlyActionsResetAt': monthlyActionsResetAt,
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', {
      eventId,
      userId,
      planStatus: 'ACTIVE',
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
 * Handle checkout.session.completed with action === 'plan_change':
 * update the existing Stripe subscription and persist the new plan to the DB.
 */
async function handlePlanChange(event, session, userId, userRepository, stripeService) {
  const { id: eventId } = event;
  const { currentSubscriptionId, targetPriceId } = session.metadata;

  billingLog('stripe_webhook_plan_change_started', { eventId, userId, currentSubscriptionId, targetPriceId });

  // Resolve target plan config from priceId
  const targetPlanConfig = Object.values(PLANS).find(p => p.stripePriceId === targetPriceId);
  if (!targetPlanConfig) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: `Unknown targetPriceId for plan change: ${targetPriceId}`,
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: `Unknown targetPriceId for plan change: ${targetPriceId}`,
      userId,
    });
    return;
  }

  // Idempotency: if user already has the target plan, skip Stripe call + DB update
  const existingUser = await userRepository.getUser(userId);
  if (existingUser?.plan === targetPlanConfig.id) {
    billingLog('stripe_webhook_idempotent_skip', { eventId, userId, reason: 'user already has target plan' });
    return;
  }

  // --- Duplicate subscription cleanup ---
  // When a plan-change checkout completes with mode:'subscription', Stripe automatically
  // creates a NEW subscription (session.subscription). We must cancel it immediately and
  // keep updating the ORIGINAL subscription (metadata.currentSubscriptionId) to avoid
  // leaving the customer with two active subscriptions.
  const newSubscriptionId = session.subscription ?? null;

  if (newSubscriptionId && newSubscriptionId !== currentSubscriptionId) {
    billingLog('plan_change_duplicate_subscription_detected', {
      eventId,
      userId,
      originalSubscriptionId: currentSubscriptionId,
      newSubscriptionId,
      targetPriceId,
    });

    try {
      await stripeService.cancelSubscription(newSubscriptionId);
      billingLog('plan_change_duplicate_subscription_cancelled', {
        eventId,
        userId,
        originalSubscriptionId: currentSubscriptionId,
        newSubscriptionId,
        targetPriceId,
      });
    } catch (err) {
      billingLogError('stripe_webhook_plan_change_cancel_duplicate_failed', {
        eventId,
        userId,
        newSubscriptionId,
        reason: err.message,
      });
      throw err;
    }
  }
  // --- End duplicate subscription cleanup ---

  // Retrieve current subscription to get the existing item ID (required to avoid creating a second item)
  let subscription;
  try {
    subscription = await stripeService.retrieveSubscription(currentSubscriptionId);
  } catch (err) {
    billingLogError('stripe_webhook_plan_change_retrieve_failed', { eventId, userId, currentSubscriptionId, reason: err.message });
    throw err;
  }

  const existingItemId = subscription.items.data[0].id;

  try {
    await stripeService.updateSubscription(currentSubscriptionId, {
      itemId: existingItemId,
      priceId: targetPriceId,
    });
    billingLog('stripe_webhook_plan_change_subscription_updated', { eventId, userId, subscriptionId: currentSubscriptionId, targetPriceId });
  } catch (err) {
    billingLogError('stripe_webhook_plan_change_update_failed', { eventId, userId, currentSubscriptionId, targetPriceId, reason: err.message });
    throw err;
  }

  const monthlyActionsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: targetPlanConfig.id,
      planStatus: 'ACTIVE',
      'limits.maxActiveSeries': targetPlanConfig.maxActiveSeries ?? null,
      'limits.monthlyActionsMax': targetPlanConfig.maxMonthlyActions ?? null,
      'limits.monthlyActionsRemaining': targetPlanConfig.maxMonthlyActions ?? null,
      'limits.monthlyActionsResetAt': monthlyActionsResetAt,
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', { eventId, userId, planStatus: 'ACTIVE', plan: targetPlanConfig.id });
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
 * Handle checkout.session.completed: activate the subscription for the user.
 * This is the primary activation event when using Stripe Checkout.
 */
async function handleCheckoutSessionCompleted(event, userRepository, stripeService) {
  const { id: eventId } = event;
  const session = event.data.object;

  // client_reference_id is the most reliable source; metadata.userId is the fallback
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  if (!userId) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: 'Cannot determine userId from checkout.session.completed payload',
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: 'Cannot determine userId from checkout.session.completed payload',
      customerId: session.customer ?? null,
    });
    return;
  }

  // Plan change flow: payment was collected to authorize updating an existing subscription
  if (session.metadata?.action === 'plan_change') {
    return handlePlanChange(event, session, userId, userRepository, stripeService);
  }

  // internalPlan is the current key; plan is the legacy fallback
  const planKey = session.metadata?.internalPlan ?? session.metadata?.plan ?? null;
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

  // Pre-read to determine whether subscribedAt should be set (only on first activation)
  const existingUser = await userRepository.getUser(userId);
  const subscribedAt = existingUser?.subscribedAt ?? new Date().toISOString();

  // Reset monthly actions quota to the new plan's full limit
  const monthlyActionsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: planId,
      planStatus: 'ACTIVE',
      stripeCustomerId: session.customer ?? null,
      stripeSubscriptionId: session.subscription ?? null,
      'limits.maxActiveSeries': planConfig?.maxActiveSeries ?? null,
      'limits.monthlyActionsMax': planConfig?.maxMonthlyActions ?? null,
      'limits.monthlyActionsRemaining': planConfig?.maxMonthlyActions ?? null,
      'limits.monthlyActionsResetAt': monthlyActionsResetAt,
      subscribedAt,
      canceledAt: null,
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', {
      eventId,
      userId,
      planStatus: 'ACTIVE',
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
 * Handle invoice.payment_failed: mark the subscription as past due.
 * Stripe will retry automatically; do not cancel the plan yet.
 */
async function handleInvoicePaymentFailed(event, userRepository) {
  const { id: eventId } = event;
  const invoiceObject = event.data.object;

  const userId = await resolveUserIdFromInvoice(invoiceObject, userRepository);
  if (!userId) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: 'Cannot determine userId from invoice.payment_failed payload',
    });
    await userRepository.recordFailedStripeEvent({
      eventId,
      type: event.type,
      reason: 'Cannot determine userId from invoice.payment_failed payload',
      customerId: invoiceObject.customer ?? null,
      customerEmail: invoiceObject.customer_email ?? null,
    });
    return;
  }

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      planStatus: 'PAST_DUE',
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('stripe_webhook_transaction_committed', {
      eventId,
      userId,
      planStatus: 'PAST_DUE',
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
async function handleSubscriptionDeleted(event, userRepository) {
  const { id: eventId } = event;
  const subscriptionObject = event.data.object;

  // Stripe subscription that was deleted
  const deletedSubscriptionId = subscriptionObject.id;

  // Subscription metadata normally contains the userId
  let userId = subscriptionObject?.metadata?.userId ?? null;

  // Fallback: resolve userId using the Stripe customerId
  if (!userId && subscriptionObject.customer) {
    const user = await userRepository.getUserByCustomerId(subscriptionObject.customer);
    if (user) userId = user.id;
  }

  // If we cannot determine the user, log and stop processing
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

  // Load user to verify authoritative subscription
  const user = await userRepository.getUser(userId);

  if (!user) {
    billingLogError('stripe_webhook_non_retryable_error', {
      eventId,
      reason: 'User not found while processing subscription.deleted',
      userId,
    });
    return;
  }

  /**
   * CRITICAL FIX
   *
   * Only process the deletion if the deleted subscription matches
   * the authoritative subscription stored in the user record.
   *
   * This prevents temporary Stripe subscriptions (created during
   * plan-change checkouts) from accidentally downgrading the user.
   */
  if (deletedSubscriptionId !== user.stripeSubscriptionId) {
    billingLog('subscription_deleted_ignored_non_authoritative', {
      eventId,
      userId,
      deletedSubscriptionId,
      storedSubscriptionId: user.stripeSubscriptionId,
    });

    return;
  }

  billingLog('stripe_webhook_transaction_started', { eventId });

  try {
    const { skipped } = await userRepository.atomicProcessStripeEvent(eventId, userId, {
      plan: 'freemium',
      planStatus: 'CANCELED',
      stripeSubscriptionId: null,
      canceledAt: new Date().toISOString(),
      'limits.monthlyActionsMax': 0,
      'limits.monthlyActionsRemaining': 0,
    });

    if (skipped) {
      billingLog('stripe_webhook_idempotent_skip', { eventId, userId });
      return;
    }

    billingLog('subscription_deleted_authoritative', {
      eventId,
      userId,
      subscriptionId: deletedSubscriptionId,
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
  const { userRepository, stripeService } = deps;
  const { type, id: eventId } = event;
  const start = Date.now();

  try {
    if (type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event, userRepository, stripeService);
    } else if (type === 'invoice.paid') {
      await handleInvoicePaid(event, userRepository);
    } else if (type === 'invoice.payment_failed') {
      await handleInvoicePaymentFailed(event, userRepository);
    } else if (type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event, userRepository);
    } else {
      billingLog('stripe_webhook_unhandled_event', { eventId, eventType: type });
    }

    billingLog('webhook.processed', { stripeEventId: eventId, stripeEventType: type, duration_ms: Date.now() - start });
  } catch (err) {
    billingLogError('webhook.failure', { stripeEventId: eventId, stripeEventType: type, duration_ms: Date.now() - start, errorCode: err.code || err.name });
    throw err;
  }
}
