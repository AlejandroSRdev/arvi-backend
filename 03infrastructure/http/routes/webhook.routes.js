/**
 * Webhook Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/webhook.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Definición de rutas de webhooks (Stripe)
 */

import express from 'express';
import { stripeWebhook } from '../controllers/WebhookController.js';

const router = express.Router();

// POST /api/webhooks/stripe
router.post('/', stripeWebhook);

export default router;