/**
 * Payment Provider Port (Interface)
 *
 * PATRÓN: Hexagonal Architecture - Port
 * EXTRACCIÓN: src/routes/stripe.routes.js, src/controllers/webhookController.js
 *
 * Define QUÉ necesita el dominio para trabajar con pagos.
 * NO define CÓMO se implementa (sin Stripe, sin SDKs, sin firmas).
 *
 * Implementaciones esperadas:
 * - infrastructure/payment/stripe/StripePaymentProvider.js
 */

/**
 * Contrato de proveedor de pagos
 *
 * Operaciones extraídas de:
 * - src/routes/stripe.routes.js (líneas 28-114)
 * - src/controllers/webhookController.js (líneas 22-74)
 */
export class IPaymentProvider {
  /**
   * Crear sesión de checkout para suscripción
   * @param {string} userId - ID del usuario
   * @param {string} planId - ID del plan
   * @returns {Promise<Object>} {url, sessionId}
   */
  async createCheckoutSession(userId, planId) {
    throw new Error('Not implemented');
  }

  /**
   * Crear sesión del portal de gestión de suscripción
   * @param {string} customerId - Stripe Customer ID
   * @returns {Promise<Object>} {url}
   */
  async createPortalSession(customerId) {
    throw new Error('Not implemented');
  }

  /**
   * Procesar evento de webhook
   * @param {string} rawBody - Cuerpo crudo del webhook
   * @param {string} signature - Firma del webhook
   * @returns {Promise<Object>} {received: boolean, eventType: string}
   */
  async handleWebhookEvent(rawBody, signature) {
    throw new Error('Not implemented');
  }
}

export default IPaymentProvider;
