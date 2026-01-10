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

import { startPayment } from '../../../domain/use-cases/StartPayment.js';

/**
 * POST /api/payments/start
 * Iniciar proceso de pago
 *
 * MIDDLEWARE REQUERIDO: authenticate (para obtener req.user.uid)
 */
export async function start(req, res, next) {
  try {
    const { planId } = req.body;
    const userId = req.user?.uid; // ✅ userId desde token validado, NO desde body

    // Validación HTTP básica
    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    if (!planId) {
      throw new ValidationError('planId es requerido');
    }

    // Delegar a use case (toda la lógica de negocio está ahí)
    const result = await startPayment({ userId, planId });

    // Log estructurado para auditoría
    success('Pago iniciado', {
      action: 'payment_start',
      userId,
      planId,
      sessionId: result.sessionId,
    });

    // Respuesta en formato esperado por el frontend
    res.json({
      success: true,
      message: 'Pago iniciado',
      checkoutUrl: result.checkoutUrl,
    });
  } catch (err) {
    logError('Error iniciando pago:', err);

    // Si es error de validación, devolver formato esperado por frontend
    if (err instanceof ValidationError || err.message.includes('Plan')) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Otros errores (Stripe, etc.)
    res.status(500).json({
      success: false,
      message: 'Error procesando solicitud de pago',
    });
  }
}

export default {
  start,
};
