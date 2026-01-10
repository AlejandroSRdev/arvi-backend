/**
 * Start Payment Use Case (Domain)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-02
 *
 * RESPONSABILIDAD ÚNICA:
 * - Validar que el plan existe y es de pago
 * - Crear sesión de Stripe Checkout
 * - Asociar userId + planId en metadata de Stripe
 * - Devolver checkoutUrl para redirigir al usuario
 * - NO confirma pagos (eso lo hace el webhook)
 * - NO activa planes (eso lo hace ProcessSubscription)
 *
 * INTEGRACIÓN CON WEBHOOK:
 * - El webhook recibirá checkout.session.completed con metadata {userId, plan}
 * - ProcessSubscription.processCheckoutCompleted activará el plan
 * - Esta separación garantiza que solo pagos confirmados activen planes
 *
 * SEGURIDAD:
 * - userId DEBE venir del contexto autenticado (middleware)
 * - NO confiar en datos del frontend para confirmar pagos
 * - Metadata en Stripe permite trazabilidad completa
 */

import { PLANS } from '../policies/PlanPolicy.js';
import { stripe } from '../../infrastructure/payment/stripe/StripeConfig.js';

/**
 * Iniciar proceso de pago
 *
 * @param {Object} paymentData - Datos del pago {userId, planId}
 * @param {string} paymentData.userId - ID del usuario autenticado
 * @param {string} paymentData.planId - ID del plan a comprar
 * @returns {Promise<Object>} {checkoutUrl: string}
 * @throws {ValidationError} Si el plan no existe o no es de pago
 */
export async function startPayment(paymentData) {
  const { userId, planId } = paymentData;

  // Validaciones de entrada
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('userId es requerido y debe ser string');
  }

  if (!planId || typeof planId !== 'string') {
    throw new ValidationError('planId es requerido y debe ser string');
  }

  // Validar que el plan existe
  const normalizedPlanId = planId.trim().toUpperCase();
  const planConfig = PLANS[normalizedPlanId];

  if (!planConfig) {
    throw new ValidationError(
      `Plan "${planId}" no existe. Planes válidos: mini, base, pro`
    );
  }

  // Validar que el plan es de pago (no freemium ni trial)
  if (!planConfig.stripePriceId) {
    throw new ValidationError(
      `Plan "${planId}" no está disponible para compra. Solo planes de pago: mini, base, pro`
    );
  }

  // Crear sesión de Stripe Checkout
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.SUCCESS_BASE_URL}?plan=${planId}&success=true`,
      cancel_url: process.env.CANCEL_URL,

      // Vinculación segura del usuario
      client_reference_id: userId,
      metadata: {
        userId,
        plan: planId,
        source: 'arvi_backend_v2',
        timestamp: new Date().toISOString(),
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id, // Para tracking interno si es necesario
    };
  } catch (stripeError) {
    // Traducir errores de Stripe a errores de dominio
    throw new Error(`Error creando sesión de pago: ${stripeError.message}`);
  }
}

export default {
  startPayment,
};
