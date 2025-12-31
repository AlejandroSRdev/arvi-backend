/**
 * Stripe Adapter (Infrastructure)
 *
 * ESTADO ACTUAL: NO IMPLEMENTADO
 * RAZÓN: La lógica de Stripe está actualmente inline en:
 *   - infrastructure/http/routes/stripe.routes.js (createCheckoutSession, createPortalSession)
 *   - infrastructure/http/controllers/WebhookController.js (handleWebhookEvent)
 *
 * IMPLEMENTARÍA: domain/ports/IPaymentProvider.js
 *
 * NOTA: Esta es una MIGRACIÓN ESTRUCTURAL, no una refactorización.
 *       Mover la lógica desde routes/controllers a este adapter sería
 *       REFACTORIZACIÓN FUNCIONAL, lo cual está fuera del alcance.
 *
 * DEUDA TÉCNICA IDENTIFICADA:
 * - En el futuro, extraer lógica de stripe.routes.js líneas 32-91
 * - En el futuro, extraer lógica de stripe.routes.js líneas 97-118
 * - En el futuro, extraer verificación de webhook de WebhookController.js
 *
 * Responsabilidades potenciales (cuando se implemente):
 * - Crear sesiones de checkout (stripe.checkout.sessions.create)
 * - Crear sesiones de portal (stripe.billingPortal.sessions.create)
 * - Verificar y procesar webhooks (stripe.webhooks.constructEvent)
 */

import { stripe, webhookSecret } from './StripeConfig.js';
import { IPaymentProvider } from '../../../domain/ports/IPaymentProvider.js';

/**
 * Implementación de Stripe para IPaymentProvider
 *
 * ESTADO: ESQUELETO - La lógica está actualmente en routes/controllers
 */
export class StripeAdapter extends IPaymentProvider {
  /**
   * Crear sesión de checkout para suscripción
   *
   * ESTADO: NO IMPLEMENTADO
   * UBICACIÓN ACTUAL: infrastructure/http/routes/stripe.routes.js líneas 32-91
   *
   * @param {string} userId - ID del usuario
   * @param {string} planId - ID del plan
   * @returns {Promise<Object>} {url, sessionId}
   */
  async createCheckoutSession(userId, planId) {
    throw new Error('Not implemented - lógica en stripe.routes.js');
  }

  /**
   * Crear sesión del portal de gestión de suscripción
   *
   * ESTADO: NO IMPLEMENTADO
   * UBICACIÓN ACTUAL: infrastructure/http/routes/stripe.routes.js líneas 97-118
   *
   * @param {string} customerId - Stripe Customer ID
   * @returns {Promise<Object>} {url}
   */
  async createPortalSession(customerId) {
    throw new Error('Not implemented - lógica en stripe.routes.js');
  }

  /**
   * Procesar evento de webhook
   *
   * ESTADO: NO IMPLEMENTADO
   * UBICACIÓN ACTUAL: infrastructure/http/controllers/WebhookController.js líneas 47-106
   *
   * @param {string} rawBody - Cuerpo crudo del webhook
   * @param {string} signature - Firma del webhook
   * @returns {Promise<Object>} {received: boolean, eventType: string}
   */
  async handleWebhookEvent(rawBody, signature) {
    throw new Error('Not implemented - lógica en WebhookController.js');
  }
}

export default StripeAdapter;
