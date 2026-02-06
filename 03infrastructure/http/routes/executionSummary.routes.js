/**
 * Execution Summary Routes (Infrastructure - HTTP)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * PATRÓN REPLICADO DE: habitSeries.routes.js
 * Este flujo replica el patrón de crearSerieTematica para mantener contratos frontend-backend consistentes.
 *
 * ENDPOINTS:
 * POST /api/execution-summaries - Validar si el usuario puede generar un resumen de ejecución
 */

import express from 'express';
import { generateExecutionSummaryEndpoint } from '../controllers/ExecutionSummaryController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * POST /api/execution-summaries
 * Validar acceso y límites para generar un resumen de ejecución
 *
 * Body: {} (payload vacío por ahora)
 *
 * ORDEN DE MIDDLEWARES:
 * 1. authenticate - Verifica token Firebase
 * 2. generateExecutionSummaryEndpoint - Controller (valida internamente con use-case)
 *
 * NOTA: La validación de feature access y límites se hace DENTRO del use-case,
 *       no como middleware, para tener respuestas semánticas claras.
 */
router.post('/', generateExecutionSummaryEndpoint);

export default router;
