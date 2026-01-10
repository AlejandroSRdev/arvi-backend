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
 * - domain/use-cases/ProcessSubscription.js:processCheckoutCompleted (líneas 79-106 del original)
 * - domain/use-cases/ProcessSubscription.js:processSubscriptionUpdated (líneas 112-153 del original)
 * - domain/use-cases/ProcessSubscription.js:processSubscriptionDeleted (líneas 160-186 del original)
 */

import { stripe, webhookSecret } from '../../../infrastructure/payment/stripe/StripeConfig.js';
import {
  processCheckoutCompleted,
  processSubscriptionUpdated,
  processSubscriptionDeleted,
} from '../../../domain/use-cases/ProcessSubscription.js';

// Dependency injection - estas serán inyectadas en runtime
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

// EXTRACCIÓN EXACTA: src/controllers/webhookController.js:16
// Cache para eventos procesados (idempotencia simple en memoria)
const processedEvents = new Set();

/**
 * POST /api/webhooks/stripe
 * Webhook de Stripe para confirmaciones de pago
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/webhookController.js:22-74
 */
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:28-33
    // Construir evento verificando la firma
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logError(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:35-39
  // Idempotencia: verificar si ya procesamos este evento
  if (processedEvents.has(event.id)) {
    console.log(`⚠️ Evento duplicado ignorado: ${event.id}`);
    return res.json({ received: true, duplicate: true });
  }

  // Manejar el evento
  try {
    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:43
    console.log(`📨 [Webhook] Recibido: ${event.type} (${event.id})`);

    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:45-60
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

    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:62-66
    // Marcar evento como procesado
    processedEvents.add(event.id);

    // Limpiar cache después de 24h (evitar memoria infinita)
    setTimeout(() => processedEvents.delete(event.id), 24 * 60 * 60 * 1000);

    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:68
    res.json({ received: true });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:70-72
    logError('Error procesando webhook:', err);
    // IMPORTANTE: Siempre responder 200 si la firma es válida
    res.status(200).json({ received: true, error: err.message });
  }
}

/**
 * Manejar checkout completado (pago exitoso)
 *
 * DELEGACIÓN: domain/use-cases/ProcessSubscription.js:processCheckoutCompleted
 * COMPORTAMIENTO ORIGINAL: src/controllers/webhookController.js:79-106
 */
async function handleCheckoutCompleted(event) {
  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:80-82
  const session = event.data.object;
  const { metadata, customer, subscription } = session;
  const { userId, plan } = metadata;

  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:84-87
  if (!userId || !plan) {
    logError('Webhook sin metadata de userId o plan');
    return;
  }

  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:89-93
  console.log(`✅ [Webhook] checkout.session.completed`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → User ID: ${userId}`);
  console.log(`   → Plan: ${plan}`);
  console.log(`   → Customer: ${customer}`);

  // DELEGACIÓN A USE CASE (reemplaza líneas 95-105 del original)
  await processCheckoutCompleted(
    {
      userId,
      plan,
      subscriptionId: subscription,
      customerId: customer,
    },
    { userRepository }
  );

  success(`Suscripción activada: ${userId} → ${plan}`);
}

/**
 * Manejar actualización de suscripción
 *
 * DELEGACIÓN: domain/use-cases/ProcessSubscription.js:processSubscriptionUpdated
 * COMPORTAMIENTO ORIGINAL: src/controllers/webhookController.js:112-153
 */
async function handleSubscriptionUpdated(event) {
  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:113-117
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const currentPeriodEnd = subscription.current_period_end;

  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:119-123
  console.log(`🔄 [Webhook] customer.subscription.updated`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → Customer: ${customerId}`);
  console.log(`   → Status: ${status}`);
  console.log(`   → Cancel at period end: ${cancelAtPeriodEnd}`);

  // DELEGACIÓN A USE CASE (reemplaza líneas 125-152 del original)
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

    // Logs según el caso (EXTRACCIÓN: líneas 137-143 y 149-152 del original)
    if (cancelAtPeriodEnd) {
      console.log(`⏳ [Webhook] Cancelación programada para fin de periodo`);
      console.log(`   → Acceso hasta: ${new Date(currentPeriodEnd * 1000).toISOString()}`);
      success(`Cancelación programada: acceso hasta ${new Date(currentPeriodEnd * 1000).toISOString()}`);
    } else {
      console.log(`📊 [Webhook] Actualizando estado de suscripción`);
      success(`Suscripción actualizada → ${status}`);
    }
  } catch (err) {
    logError(`Error procesando subscription.updated: ${err.message}`);
  }
}

/**
 * Manejar cancelación definitiva de suscripción
 *
 * DELEGACIÓN: domain/use-cases/ProcessSubscription.js:processSubscriptionDeleted
 * COMPORTAMIENTO ORIGINAL: src/controllers/webhookController.js:160-186
 */
async function handleSubscriptionDeleted(event) {
  // EXTRACCIÓN EXACTA: src/controllers/webhookController.js:161-167
  const subscription = event.data.object;
  const customerId = subscription.customer;

  console.log(`❌ [Webhook] customer.subscription.deleted`);
  console.log(`   → Event ID: ${event.id}`);
  console.log(`   → Customer: ${customerId}`);
  console.log(`   → Este es el FIN REAL del periodo - usuario pierde acceso`);

  // DELEGACIÓN A USE CASE (reemplaza líneas 169-185 del original)
  try {
    await processSubscriptionDeleted({ customerId }, { userRepository });

    success(`Suscripción cancelada definitivamente → revertido a freemium`);
  } catch (err) {
    logError(`Error procesando subscription.deleted: ${err.message}`);
  }
}

export default {
  stripeWebhook,
  setDependencies,
};
