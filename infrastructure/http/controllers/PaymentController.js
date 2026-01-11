/**
 * Payment Controller (Infrastructure - HTTP Layer)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-02
 *
 * RESPONSABILIDAD ÚNICA:
 * - Adaptar HTTP (req/res) → Use Cases
 * - Extraer userId del contexto autenticado (req.user)
 * - Validar input HTTP
 * - Traducir respuesta del use case al formato esperado por el frontend
 * - NO contiene lógica de negocio
 * - NO llama a Stripe directamente
 *
 * CONTRATO FRONTEND ↔ BACKEND (INMUTABLE):
 * Request:  { "planId": "string" }
 * Response: { "success": true, "message": "Pago iniciado", "checkoutUrl": "..." }
 * Error:    { "success": false, "message": "..." }
 *
 * SEGURIDAD:
 * - userId extraído de req.user (validado por middleware authenticate)
 * - NO confiar en datos del frontend para identificar usuario
 * - Toda la lógica de validación y creación está en StartPayment use case
 */

import { startPayment } from '../../../application/use-cases/StartPayment.js';
import { stripe } from '../../payment/stripe/StripeConfig.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../../errorMapper.js';
import { error as logError, success } from '../../../utils/logger.js';

/**
 * POST /api/payments/start
 * Iniciar proceso de pago
 *
 * MIDDLEWARE REQUERIDO: authenticate (para obtener req.user.uid)
 */
export async function start(req, res) {
  try {
    const { planId } = req.body;
    const userId = req.user?.uid;

    // Delegar a use case con stripeClient inyectado
    const result = await startPayment({
      userId,
      planId,
      stripeClient: stripe
    });

    // Log estructurado para auditoría
    success('Pago iniciado', {
      action: 'payment_start',
      userId,
      planId,
      sessionId: result.sessionId,
    });

    // Respuesta en formato esperado por el frontend
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pago iniciado',
      checkoutUrl: result.checkoutUrl,
    });
  } catch (err) {
    logError('Error iniciando pago:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json({
      success: false,
      message: httpError.body.message,
    });
  }
}

export default {
  start,
};
