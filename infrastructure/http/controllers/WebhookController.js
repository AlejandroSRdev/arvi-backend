/**
 * Webhook Controller (Infrastructure - HTTP Layer)
 *
 * MIGRADO DESDE: src/controllers/webhookController.js
 * REFACTORIZADO: 2025-12-29
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 *
 * RESPONSABILIDAD ÚNICA:
 * - Verificar firma de Stripe webhook
 * - Parsear eventos de Stripe
 * - Delegar procesamiento a use cases
 * - Gestionar idempotencia (cache de eventos procesados)
 * - Responder a Stripe con códigos HTTP apropiados
 * - NO contiene lógica de negocio
 *
 * LÓGICA MOVIDA A:
 * - application/use-cases/ProcessSubscription.js:processCheckoutCompleted
 * - application/use-cases/ProcessSubscription.js:processSubscriptionUpdated
 * - application/use-cases/ProcessSubscription.js:processSubscriptionDeleted
 */

import { stripe, webhookSecret } from '../../payment/stripe/StripeConfig.js';
import {
  processCheckoutCompleted,
  processSubscriptionUpdated,
  processSubscriptionDeleted,
} from '../../../application/use-cases/ProcessSubscription.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { logger } from '../../logger/logger.js';

// Dependency injection
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

// Cache para eventos procesados (idempotencia simple en memoria)
const processedEvents = new Set();

/**
 * POST /api/webhooks/stripe
 * Webhook de Stripe para confirmaciones de pago
 */
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Construir evento verificando la firma
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  // Idempotencia: verificar si ya procesamos este evento
  if (processedEvents.has(event.id)) {
    console.log(`⚠️ Evento duplicado ignorado: ${event.id}`);
    return res.status(HTTP_STATUS.OK).json({ received: true, duplicate: true });
  }

  // Manejar el evento
  try {
    console.log(`📨 [Webhook] Recibido: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // Marcar evento como procesado
    processedEvents.add(event.id);

    // Limpiar cache después de 24h (evitar memoria infinita)
    setTimeout(() => processedEvents.delete(event.id), 24 * 60 * 60 * 1000);

    res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (err) {
    logger.error('Error procesando webhook:', err);
    // IMPORTANTE: Siempre responder 200 si la firma es válida
    res.status(HTTP_STATUS.OK).json({ received: true, error: err.message });
  }
}

/**
 * Manejar checkout completado (pago exitoso)
 */
async function handleCheckoutCompleted(event) {
  const session = event.data.object;
  const { metadata, customer, subscription } = session;
  const { userId, plan } = metadata;

  if (!userId || !plan) {
    logger.error('Webhook sin metadata de userId o plan');
    return;
  }

  console.log(`✅ [Webhook] checkout.session.completed`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → User ID: ${userId}`);
  console.log(`   → Plan: ${plan}`);
  console.log(`   → Customer: ${customer}`);

  await processCheckoutCompleted(
    {
      userId,
      plan,
      subscriptionId: subscription,
      customerId: customer,
    },
    { userRepository }
  );

  logger.success(`Suscripción activada: ${userId} → ${plan}`);
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(event) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const currentPeriodEnd = subscription.current_period_end;

  console.log(`🔄 [Webhook] customer.subscription.updated`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → Customer: ${customerId}`);
  console.log(`   → Status: ${status}`);
  console.log(`   → Cancel at period end: ${cancelAtPeriodEnd}`);

  try {
    await processSubscriptionUpdated(
      {
        customerId,
        status,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      },
      { userRepository }
    );

    if (cancelAtPeriodEnd) {
      console.log(`⏳ [Webhook] Cancelación programada para fin de periodo`);
      console.log(`   → Acceso hasta: ${new Date(currentPeriodEnd * 1000).toISOString()}`);
      logger.success(`Cancelación programada: acceso hasta ${new Date(currentPeriodEnd * 1000).toISOString()}`);
    } else {
      console.log(`📊 [Webhook] Actualizando estado de suscripción`);
      logger.success(`Suscripción actualizada → ${status}`);
    }
  } catch (err) {
    logger.error(`Error procesando subscription.updated: ${err.message}`);
  }
}

/**
 * Manejar cancelación definitiva de suscripción
 */
async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  console.log(`❌ [Webhook] customer.subscription.deleted`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → Customer: ${customerId}`);
  console.log(`   → Este es el FIN REAL del periodo - usuario pierde acceso`);

  try {
    await processSubscriptionDeleted({ customerId }, { userRepository });

    logger.success(`Suscripción cancelada definitivamente → revertido a freemium`);
  } catch (err) {
    logger.error(`Error procesando subscription.deleted: ${err.message}`);
  }
}

export default {
  stripeWebhook,
  setDependencies,
};
