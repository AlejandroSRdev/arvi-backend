/**
 * Layer: Infrastructure
 * File: HabitSeriesRoutes.js
 * Responsibility:
 * Registers Express routes for habit series endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import { createHabitSeriesEndpoint, deleteHabitSeriesEndpoint, getHabitSeriesEndpoint } from '../controllers/HabitSeriesController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/habits/series
 * Returns authenticated user's habit series (ordered by createdAt DESC).
 */
router.get('/series', getHabitSeriesEndpoint);

/**
 * POST /api/habits/series
 * Creates a new habit series via AI.
 */
router.post('/series', createHabitSeriesEndpoint);

/**
 * DELETE /api/habits/series/:seriesId
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
