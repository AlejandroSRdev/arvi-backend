/**
 * Layer: Infrastructure
 * File: Billing.routes.js
 * Responsibility:
 * Registers Express routes for billing endpoints. Authentication required.
 */

import express from 'express';
import { createCheckoutSessionEndpoint } from '../controllers/BillingController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { generalRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(generalRateLimiter);
router.use(authenticate);

/**
 * POST /api/billing/create-checkout-session
 * Creates a Stripe Checkout Session for the authenticated user.
 * Body: { plan: 'BASE' | 'PRO' }
 * Response: { url: string }
 */
router.post('/create-checkout-session', createCheckoutSessionEndpoint);

export default router;
