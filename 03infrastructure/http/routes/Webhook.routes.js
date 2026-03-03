/**
 * Layer: Infrastructure
 * File: Webhook.routes.js
 * Responsibility:
 * Registers webhook endpoints. Raw body middleware is applied only to this router
 * so that Stripe signature verification receives the unmodified request body.
 * This router must be mounted BEFORE the global express.json() middleware in server.js.
 */

import express from 'express';
import { stripeWebhookEndpoint } from '../controllers/BillingController.js';

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler. Raw body required for signature verification.
 * No authentication — request is verified via Stripe-Signature header.
 */
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhookEndpoint);

export default router;
