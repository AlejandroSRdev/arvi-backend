/**
 * Layer: Infrastructure
 * File: HabitSeriesController.js
 * Responsibility:
 * Adapts HTTP requests to habit series use cases and translates application errors into HTTP responses.
 */

import { createHabitSeries } from '../../../02application/use-cases/CreateHabitSeriesUseCase.js';
import { AuthenticationError, NotFoundError, ValidationError } from '../../../errors/Index.js';
import { logger } from '../../logger/Logger.js';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { toHabitSeriesOutputDTO } from '../../mappers/HabitSeriesMapper.js';
import { HTTP_STATUS } from '../HttpStatus.js';

// Dependency injection
let userRepository;
let habitSeriesRepository;
let energyRepository;
let aiProvider;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
  habitSeriesRepository = deps.habitSeriesRepository;
  energyRepository = deps.energyRepository;
  aiProvider = deps.aiProvider;
}

/**
 * Validate HTTP request body has required fields with correct basic types.
 * This is syntactic validation only - business rules are in the use-case.
 *
 * @param {object} body - Request body
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!body.language || (body.language !== 'es' && body.language !== 'en')) {
    return { valid: false, error: 'language is required and must be "es" or "en"' };
  }

  if (!body.testData || typeof body.testData !== 'object') {
    return { valid: false, error: 'testData is required and must be an object' };
  }

  // assistantContext can be optional, default to empty string
  if (body.assistantContext !== undefined && typeof body.assistantContext !== 'string') {
    return { valid: false, error: 'assistantContext must be a string' };
  }

  return { valid: true };
}

/**
 * POST /api/habits/series
 *
 * Creates a new habit series via AI.
 *
 * Request body:
 * - language: 'es' | 'en'
 * - testData: Record<string, string>
 * - assistantContext?: string
 *
 * Response (201 Created): Full Habit Series DTO
 * - id: string
 * - title: string
 * - description: string
 * - actions: Array<{
 *     name: string,
 *     description: string,
 *     difficulty: 'low' | 'medium' | 'high'
 *   }>
 * - rank: 'bronze' | 'silver' | 'golden' | 'diamond'
 * - totalScore: number
 * - createdAt: string (ISO)
 * - lastActivityAt: string (ISO)
 */
export async function createHabitSeriesEndpoint(req, res, next) {
  console.log('🟢 Controller reached');
  try {
    const userId = req.user?.uid;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Syntactic validation of HTTP input
    const validation = validateRequestBody(req.body);
    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Transform HTTP DTO to Application Contract input
    const payload = {
      language: req.body.language,
      testData: req.body.testData,
      assistantContext: req.body.assistantContext || '',
    };

    // Invoke use-case
    const habitSeries = await createHabitSeries(userId, payload, {
      userRepository,
      habitSeriesRepository,
      energyRepository,
      aiProvider,
    });

    const responseDTO = toHabitSeriesOutputDTO(habitSeries);

    return res.status(HTTP_STATUS.CREATED).json(responseDTO);

  } catch (err) {

    console.error('🚨 [Controller Error] CreateHabitSeries failed');
    console.error('📌 Name:', err?.name);
    console.error('📌 Message:', err?.message);
    console.error('📌 Status:', err?.response?.status || err?.status);
    console.error('📌 Data:', err?.response?.data || null);
    console.error('📌 Stack:', err?.stack);

    return next(err);
  }
}

/**
 * DELETE /api/habits/series/:seriesId
 *
 * Atomically deletes a habit series, all its actions, and decrements the counter.
 * Always returns 204 (idempotent — safe to retry and call concurrently).
 *
 * Responses:
 * - 204 No Content  → success OR series does not exist
 * - 401 Unauthorized → missing or invalid token
 * - 400 Bad Request  → invalid seriesId
 * - 500 Internal Server Error → unexpected errors only
 */
export async function deleteHabitSeriesEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const seriesId = req.params?.seriesId;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!seriesId || typeof seriesId !== 'string' || seriesId.trim() === '') {
      throw new ValidationError('seriesId is required');
    }

    const result = await habitSeriesRepository.delete(userId, seriesId);

    const outcome = result.deleted ? 'deleted' : 'noop_not_found';

    logger.info('[Habit Series] Delete', {
      uid: userId,
      seriesId,
      deletedAt: new Date().toISOString(),
      outcome,
      activeSeriesCount_before: result.activeSeriesCount_before ?? null,
      activeSeriesCount_after: result.activeSeriesCount_after ?? null,
    });

    return res.status(204).send();
  } catch (err) {
    logger.error('[Habit Series] Error in delete:', err);
    return next(err);
  }
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/habits/series
 *
 * Returns the authenticated user's habit series ordered by createdAt DESC.
 *
 * Query parameters:
 * - limit (optional): number of results to return (default 20, max 50)
 *
 * Response (200 OK):
 * {
 *   data: [{ id, createdAt, updatedAt }],
 *   count: number
 * }
 */
export async function getHabitSeriesEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    let limitValue = DEFAULT_LIMIT;

    if (req.query.limit !== undefined) {
      const parsed = Number(req.query.limit);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new ValidationError('limit must be a positive number');
      }

      // Clamp to maximum allowed
      limitValue = Math.min(parsed, MAX_LIMIT);
    }

    const series = await habitSeriesRepository.listByUser(userId, limitValue);

    logger.info('[Habit Series] List', {
      uid: userId,
      limit: limitValue,
      count: series.length,
      requestedAt: new Date().toISOString(),
    });

    return res.status(HTTP_STATUS.OK).json({
      data: series,
      count: series.length,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/habits/series/:seriesId
 *
 * Returns the full HabitSeries entity for a given seriesId.
 *
 * Response (200 OK): Full Habit Series DTO (see HabitSeriesMapper)
 * Response (404 Not Found): { error: "NOT_FOUND", message: "Habit series not found" }
 */
export async function getHabitSeriesByIdEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const seriesId = req.params?.seriesId;

    logger.info('[Habit Series] GetById - request received', { uid: userId, seriesId });

    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!seriesId || seriesId.trim() === '') {
      throw new ValidationError('seriesId is required');
    }

    const series = await habitSeriesRepository.getHabitSeriesById(userId, seriesId);

    if (!series) {
      logger.info('[Habit Series] GetById - not found', { uid: userId, seriesId });
      throw new NotFoundError('Habit series not found');
    }

    logger.info('[Habit Series] GetById - series found', {
      uid: userId,
      seriesId,
      actionsCount: series.actions?.length ?? 0,
    });

    const responseDTO = toHabitSeriesOutputDTO(series);

    logger.info('[Habit Series] GetById - response sent', { uid: userId, seriesId, status: 200 });

    return res.status(HTTP_STATUS.OK).json(responseDTO);
  } catch (err) {
    logger.error('[Habit Series] GetById - error', err);
    return next(err);
  }
}

export default {
  createHabitSeriesEndpoint,
  deleteHabitSeriesEndpoint,
  getHabitSeriesEndpoint,
  getHabitSeriesByIdEndpoint,
  setDependencies,
};
