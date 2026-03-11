/**
 * Layer: Application
 * File: CreateCheckoutSessionUseCase.js
 * Responsibility:
 * Validates the requested plan, resolves the Stripe price ID,
 * and delegates checkout session creation to the Stripe service.
 */

import { PLANS } from '../../01domain/policies/PlanPolicy.js';
import { NotFoundError, ValidationError } from '../../errors/Index.js';

const BILLABLE_PLAN_KEYS = Object.entries(PLANS)
  .filter(([, plan]) => plan.isSubscription)
  .map(([key]) => key);

/**
 * Create a Stripe Checkout Session for the given user and plan.
 *
 * @param {string} userId
 * @param {string} requestedPlan - 'BASE' | 'PRO'
 * @param {Object} deps
 * @param {Object} deps.userRepository
 * @param {Object} deps.stripeService
 * @returns {Promise<{ url: string }>}
 */
export async function createCheckoutSession(userId, requestedPlan, deps) {
  const { userRepository, stripeService, logger, traceId } = deps;

  const planKey = requestedPlan?.toUpperCase();
  const plan = PLANS[planKey];

  if (!plan || !plan.isSubscription) {
    throw new ValidationError(
      `Invalid plan: "${requestedPlan}". Must be one of: ${BILLABLE_PLAN_KEYS.join(', ')}`
    );
  }

  if (!plan.stripePriceId) {
    throw new ValidationError(`No Stripe price ID configured for plan: ${planKey}`);
  }

  logger?.log('billing.checkout.plan_validated', { traceId, userId, planKey, stripePriceId: plan.stripePriceId });

  const user = await userRepository.getUser(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  logger?.log('billing.checkout.user_loaded', {
    traceId,
    userId,
    hasStripeCustomerId: !!user.stripeCustomerId,
    hasStripeSubscriptionId: !!user.stripeSubscriptionId,
  });

  // Ensure a single Stripe Customer exists for this user before creating a session.
  // stripeCustomerId is persisted on first checkout so subsequent sessions reuse it.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const result = await stripeService.createCustomer({
      email: user.email,
      metadata: { userId },
    });
    customerId = result.customerId;
    await userRepository.updateUser(userId, { stripeCustomerId: customerId });
    logger?.log('billing.checkout.customer_created', { traceId, userId, customerId });
  } else {
    logger?.log('billing.checkout.customer_reused', { traceId, userId, customerId });
  }

  const requestedPriceId = plan.stripePriceId;
  const successUrl = `${process.env.BASE_API_URL}/billing/success`;

  // If the user already has an active subscription, handle upgrade/downgrade/same plan.
  if (user.stripeSubscriptionId) {
    const subscription = await stripeService.retrieveSubscription(user.stripeSubscriptionId);
    const currentPriceId = subscription.items.data[0].price.id;

    logger?.log('billing.checkout.subscription_loaded', {
      traceId,
      userId,
      subscriptionId: user.stripeSubscriptionId,
      currentPriceId,
      requestedPriceId,
    });

    if (currentPriceId === requestedPriceId) {
      // Same plan — open Stripe Billing Portal so user can manage their subscription.
      logger?.log('billing.checkout.branch_selected', { traceId, userId, branch: 'BILLING_PORTAL' });
      const portalResult = await stripeService.createBillingPortalSession({
        customerId,
        returnUrl: successUrl,
      });
      logger?.log('billing.checkout.portal_created', { traceId, userId, hasUrl: !!portalResult.url });
      return portalResult;
    }

    // Different plan — collect payment first; webhook will update the subscription.
    // DO NOT update the subscription here: state must only change after payment is confirmed.
    logger?.log('billing.checkout.branch_selected', { traceId, userId, branch: 'PLAN_CHANGE_CHECKOUT', currentPlan: user.plan, targetPlan: planKey, subscriptionId: user.stripeSubscriptionId, requestedPriceId });
    const planChangeIdempotencyKey = `plan_change:${userId}:${planKey}`;

    const planChangeResult = await stripeService.createPlanChangeCheckoutSession({
      customerId,
      priceId: requestedPriceId,
      metadata: {
        userId,
        action: 'plan_change',
        currentSubscriptionId: user.stripeSubscriptionId,
        targetPriceId: requestedPriceId,
      },
      idempotencyKey: planChangeIdempotencyKey,
    });
    logger?.log('billing.checkout.plan_change_checkout_created', {
      traceId,
      userId,
      currentPlan: user.plan,
      targetPlan: planKey,
      stripeSubscriptionId: user.stripeSubscriptionId,
      checkoutSessionId: planChangeResult.sessionId,
    });
    return planChangeResult;
  }

  // No existing subscription — create a Stripe Checkout Session.
  // Idempotency key scoped to user + plan to prevent duplicate concurrent sessions.
  logger?.log('billing.checkout.branch_selected', { traceId, userId, branch: 'NEW_CHECKOUT', requestedPriceId });
  const idempotencyKey = `checkout:${userId}:${planKey}`;

  const sessionResult = await stripeService.createCheckoutSession({
    customerId,
    priceId: requestedPriceId,
    // internalPlan (not plan) so webhook identification is explicit and consistent
    metadata: { userId, internalPlan: planKey },
    idempotencyKey,
  });
  logger?.log('billing.checkout.checkout_created', { traceId, userId, hasUrl: !!sessionResult.url, sessionId: sessionResult.sessionId });
  return sessionResult;
}
