/**
 * Layer: Infrastructure
 * File: BillingController.js
 * Responsibility:
 * Handles billing HTTP endpoints: checkout session creation and Stripe webhook processing.
 */

import { createCheckoutSession } from '../../../02application/use-cases/CreateCheckoutSessionUseCase.js';
import { processStripeWebhook } from '../../../02application/use-cases/ProcessStripeWebhookUseCase.js';
import { ValidationError } from '../../../errors/Index.js';
import { HTTP_STATUS } from '../HttpStatus.js';
import { logger } from '../../logger/Logger.js';

// Dependency injection
let userRepository;
let stripeService;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
  stripeService = deps.stripeService;
}

/**
 * POST /api/billing/create-checkout-session
 * Auth required.
 * Body: { plan: 'BASE' | 'PRO' }
 * Response: { url: string }
 */
export async function createCheckoutSessionEndpoint(req, res, next) {
  const userId = req.user.id;
  const { plan } = req.body;
  const stripeMode = process.env.STRIPE_MODE ?? 'test';

  try {
    logger.log('checkout_session_requested', { userId, requestedPlan: plan, stripeMode });

    if (!plan) {
      throw new ValidationError('plan is required');
    }

    const { url, sessionId } = await createCheckoutSession(userId, plan, {
      userRepository,
      stripeService,
    });

    logger.log('stripe_session_created', { userId, stripeSessionId: sessionId, plan });

    return res.status(HTTP_STATUS.OK).json({ url });
  } catch (err) {
    logger.logError('checkout_session_error', {
      userId,
      errorType: err.code ?? err.name,
      retryable: err.code === 'STRIPE_PROVIDER_FAILURE',
    });
    return next(err);
  }
}

/**
 * POST /api/webhooks/stripe
 * Raw body required for Stripe signature verification.
 *
 * Error semantics differ from standard endpoints:
 * - 500: transient infra errors (Stripe will retry)
 * - 200: logical/non-retryable errors (Stripe should not retry)
 */
export async function stripeWebhookEndpoint(req, res) {
  const signatureHeader = req.headers['stripe-signature'];
  const stripeMode = process.env.STRIPE_MODE ?? 'test';

  // Signature verification — failure is non-retryable
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signatureHeader);
  } catch (err) {
    logger.logError('stripe_webhook_signature_invalid', { error: err.message });
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid webhook signature' });
  }

  logger.log('stripe_webhook_received', { eventId: event.id, eventType: event.type, stripeMode });

  try {
    await processStripeWebhook(event, { userRepository });
    return res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (err) {
    // Only transient infra failures are retryable (DB timeouts, transaction contention)
    if (isTransientError(err)) {
      logger.logError('stripe_webhook_retryable_error', { eventId: event.id, errorType: err.code });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Transient error, will retry' });
    }

    // Non-retryable: log and return 200 to stop Stripe from retrying indefinitely
    logger.logError('stripe_webhook_non_retryable_error', { eventId: event.id, reason: err.message });
    return res.status(HTTP_STATUS.OK).json({ received: true });
  }
}

/**
 * Returns true for errors that are transient and safe for Stripe to retry.
 */
function isTransientError(err) {
  const transientCodes = ['DATA_ACCESS_FAILURE', 'TRANSACTION_FAILURE'];
  return transientCodes.includes(err.code);
}
