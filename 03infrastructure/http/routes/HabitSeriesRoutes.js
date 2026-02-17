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
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/habits/series
 * Create a new habit series via AI.
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
