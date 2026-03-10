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
  const { userRepository, stripeService } = deps;

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

  const user = await userRepository.getUser(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

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
  }

  const requestedPriceId = plan.stripePriceId;
  const successUrl = `${process.env.BASE_API_URL}/billing/success`;

  // If the user already has an active subscription, handle upgrade/downgrade/same plan.
  if (user.stripeSubscriptionId) {
    const subscription = await stripeService.retrieveSubscription(user.stripeSubscriptionId);
    const currentPriceId = subscription.items.data[0].price.id;

    if (currentPriceId === requestedPriceId) {
      // Same plan — open Stripe Billing Portal so user can manage their subscription.
      return stripeService.createBillingPortalSession({
        customerId,
        returnUrl: successUrl,
      });
    }
  }

  // New subscription — create a Stripe Checkout Session.
  // Idempotency key scoped to user + plan to prevent duplicate concurrent sessions.
  const idempotencyKey = `checkout:${userId}:${planKey}`;

  return stripeService.createCheckoutSession({
    customerId,
    priceId: requestedPriceId,
    // internalPlan (not plan) so webhook identification is explicit and consistent
    metadata: { userId, internalPlan: planKey },
    idempotencyKey,
  });
}
