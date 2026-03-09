/**
 * Layer: Infrastructure
 * File: HabitSeriesRoutes.js
 * Responsibility:
 * Registers Express routes for habit series endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import { createHabitSeriesEndpoint, deleteHabitSeriesEndpoint, getHabitSeriesByIdEndpoint, getHabitSeriesEndpoint, createActionEndpoint } from '../controllers/HabitSeriesController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { generalRateLimiter } from '../middlewares/rateLimiter.js';
import { resolvePlan } from '../middlewares/resolvePlan.js';

const router = express.Router();

router.use(generalRateLimiter); // Apply rate limiting to all habit series routes
router.use(authenticate);
router.use(resolvePlan);

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
 * POST /api/habits/series/:seriesId/actions
 * Creates a new AI-generated action and appends it to the given series.
 */
router.post('/series/:seriesId/actions', createActionEndpoint);

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
