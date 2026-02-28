/**
 * Layer: Infrastructure
 * File: HabitSeriesRoutes.js
 * Responsibility:
 * Registers Express routes for habit series endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import { createHabitSeriesEndpoint, deleteHabitSeriesEndpoint, getHabitSeriesByIdEndpoint, getHabitSeriesEndpoint } from '../controllers/HabitSeriesController.js';
import { authenticate } from '../middlewares/authenticate.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter); // Apply rate limiting to all habit series routes
router.use(authenticate);

/**
 * GET /api/habits/series
 * Returns authenticated user's habit series (ordered by createdAt DESC).
 */
router.get('/series', getHabitSeriesEndpoint);

/**
 * GET /api/habits/series/:seriesId
 * Returns the full HabitSeries entity for the given seriesId.
 */
router.get('/series/:seriesId', getHabitSeriesByIdEndpoint);

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
