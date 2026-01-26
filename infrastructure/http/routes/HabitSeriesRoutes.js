/**
 * Habit Series Routes (Infrastructure - HTTP)
 *
 * ARCHITECTURE: Hexagonal (Ports & Adapters)
 *
 * ENDPOINTS:
 * POST /api/habits/series - Create a new habit series via AI
 * DELETE /api/habits/series/:seriesId - Delete a habit series
 */

import express from 'express';
import { createHabitSeriesEndpoint, deleteHabitSeriesEndpoint } from '../controllers/HabitSeriesController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/habits/series
 * Create a new habit series via AI.
 *
 * Request body:
 * - language: 'es' | 'en'
 * - testData: Record<string, string>
 * - difficultyLabels: { baja: string, media: string, alta: string }
 * - assistantContext?: string
 *
 * Response (201 Created):
 * - success: true
 * - seriesId: string
 * - titulo: string
 * - message: string
 *
 * The use-case handles:
 * - Plan/feature access validation
 * - Active series limit validation
 * - Energy availability validation
 * - AI execution (3 passes)
 * - Schema validation
 * - Persistence
 */
router.post('/series', createHabitSeriesEndpoint);

/**
 * DELETE /api/habits/series/:seriesId
 * Delete a habit series.
 *
 * Params:
 * - seriesId: string
 *
 * Response (200 OK):
 * - success: true
 * - message: string
 * - deletedSeriesId: string
 */
router.delete('/series/:seriesId', deleteHabitSeriesEndpoint);

export default router;
