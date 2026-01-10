/**
 * Payment Routes (Infrastructure - HTTP)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-02
 *
 * Responsabilidades:
 * - Definición de rutas de pagos
 * - Aplicar middleware de autenticación
 * - Conectar rutas con PaymentController
 *
 * ENDPOINTS:
 * - POST /api/payments/start - Iniciar proceso de pago
 */

import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import PaymentController from '../controllers/PaymentController.js';

const router = express.Router();

/**
 * POST /api/payments/start
 * Iniciar proceso de pago
 *
 * SEGURIDAD:
 * - Requiere autenticación (middleware authenticate)
 * - UserId extraído del token validado (req.user.uid)
 *
 * CONTRATO:
 * Request:  { "planId": "string" }
 * Response: { "success": true, "message": "Pago iniciado", "checkoutUrl": "..." }
 * Error:    { "success": false, "message": "..." }
 */
router.post('/start', authenticate, PaymentController.start);

export default router;
