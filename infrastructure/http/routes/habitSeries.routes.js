/**
 * Habit Series Routes (Infrastructure - HTTP)
 *
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 * FECHA CREACIÓN: 2026-01-03
 *
 * ENDPOINTS:
 * POST /api/habits/series - Validar si el usuario puede crear una serie de hábitos
 * DELETE /api/habits/series/:seriesId - Eliminar una serie de hábitos
 */

import express from 'express';
import { createHabitSeriesEndpoint, deleteHabitSeriesEndpoint } from '../controllers/HabitSeriesController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/habits/series
 * Validar acceso y límites para crear una serie de hábitos
 *
 * Body: {} (payload vacío por ahora)
 *
 * ORDEN DE MIDDLEWARES:
 * 1. authenticate - Verifica token Firebase
 * 2. createHabitSeriesEndpoint - Controller (valida internamente con use-case)
 *
 * NOTA: La validación de feature access y límites se hace DENTRO del use-case,
 *       no como middleware, para tener respuestas semánticas claras.
 */
router.post('/series', createHabitSeriesEndpoint);

/**
 * DELETE /api/habits/series/:seriesId
 * Eliminar una serie de hábitos
 *
 * Params: seriesId (capturado pero no validado contra BD, solo decrementa contador)
 *
 * ORDEN DE MIDDLEWARES:
 * 1. authenticate - Verifica token Firebase
 * 2. deleteHabitSeriesEndpoint - Controller (decrementa contador si procede)
 */
router.delete('/series/:seriesId', deleteHabitSeriesEndpoint);

export default router;
