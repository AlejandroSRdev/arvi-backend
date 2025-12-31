/**
 * Stripe Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/stripe.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Definición de rutas de Stripe (pagos, checkout, portal)
 */

import express from 'express';
import { stripe } from '../../payment/stripe/StripeConfig.js';
import { authenticate } from '../middleware/authenticate.js';
import { ValidationError } from '../../../shared/errorTypes.js';
import { success, error as logError } from '../../../shared/logger.js';
import { PLANS } from '../../../domain/policies/PlanPolicy.js';

const router = express.Router();

/**
 * POST /api/stripe/create-checkout
 * Crear sesión de checkout de Stripe
 *
 * SEGURIDAD:
 * - Requiere autenticación (middleware authenticate)
 * - UserId extraído del token validado (NO del body)
 * - Valida plan contra lista permitida en config/plans.js
 * - Vincula usuario a sesión con client_reference_id + metadata
 *
 * MIGRADO DESDE: server.js original (líneas 24-48)
 */
router.post('/create-checkout', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;
    const userId = req.user?.uid; // ✅ userId desde token validado, NO desde body

    // Validar que plan está presente
    if (!plan) {
      throw new ValidationError('Plan es requerido');
    }

    // Validar que plan existe en configuración
    const planConfig = PLANS[plan.toUpperCase()];

    if (!planConfig) {
      throw new ValidationError(`Plan "${plan}" no existe. Planes válidos: mini, base, pro`);
    }

    // Validar que plan tiene Price ID configurado
    if (!planConfig.stripePriceId) {
      logError(`Plan ${plan} no tiene stripePriceId configurado en config/plans.js`);
      throw new ValidationError(`Plan "${plan}" no está disponible para compra`);
    }

    // Crear sesión de Stripe con vinculación segura del usuario
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      success_url: `${process.env.SUCCESS_BASE_URL}?plan=${plan}&success=true`,
      cancel_url: process.env.CANCEL_URL,

      // ✅ Vinculación segura del usuario (doble mecanismo)
      client_reference_id: userId,  // ID del usuario verificado
      metadata: {
        userId,                      // Backup en metadata
        plan,                        // Plan seleccionado
        source: 'arvi_backend_v2'    // Identificador de origen
      },
    });

    // Log estructurado para auditoría
    success('Checkout session created', {
      action: 'checkout_create',
      userId,
      plan,
      sessionId: session.id,
      priceId: planConfig.stripePriceId,
      amount: planConfig.price,
      currency: planConfig.currency || 'USD',
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id, // ✅ Devolver sessionId para tracking
    });
  } catch (err) {
    logError('Error creando sesión Stripe:', err);
    next(err);
  }
});

/**
 * POST /api/stripe/portal-session
 * Crear sesión del portal de Stripe
 */
router.post('/portal-session', authenticate, async (req, res, next) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      throw new ValidationError('customerId es requerido');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.SUCCESS_BASE_URL,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    logError('Error creando portal session:', err);
    next(err);
  }
});

export default router;
