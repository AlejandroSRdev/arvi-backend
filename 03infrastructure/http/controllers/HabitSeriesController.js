/**
 * Habit Series Controller (Infrastructure - HTTP Layer)
 *
 * ARCHITECTURE: Hexagonal (Ports & Adapters)
 *
 * RESPONSIBILITIES:
 * - Extract data from HTTP request
 * - Perform minimal syntactic validation (required fields, basic types)
 * - Transform HTTP DTO to Application Contract
 * - Invoke use-cases
 * - Map application errors to HTTP responses
 *
 * STRICTLY FORBIDDEN:
 * - Business logic
 * - Domain entity instantiation
 * - AI orchestration
 * - Schema validation
 */

import { createHabitSeries } from '../../../02application/use-cases/CreateHabitSeriesUseCase.js';
import { HTTP_STATUS } from '../HttpStatus.js';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { toHabitSeriesOutputDTO } from '../../mappers/HabitSeriesMapper.js';
import { logger } from '../../logger/Logger.js';
import { ValidationError, AuthenticationError } from '../../../errors/index.js';

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
    return next(err);
  }
}

/**
 * DELETE /api/habits/series/:seriesId
 *
 * Deletes a habit series from Firestore and decrements counter.
 */
export async function deleteHabitSeriesEndpoint(req, res) {
  try {
    const userId = req.user?.uid;
    const seriesId = req.params?.seriesId;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated',
      });
    }

    if (!seriesId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'VALIDATION_ERROR',
        message: 'seriesId is required',
      });
    }

    await habitSeriesRepository.delete(userId, seriesId);

    logger.success(`[Habit Series] Deleted for user ${userId}, seriesId: ${seriesId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Series deleted successfully',
      deletedSeriesId: seriesId,
    });
  } catch (err) {
    logger.error('[Habit Series] Error in delete:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json({
      success: false,
      error: httpError.body.error,
      message: httpError.body.message,
    });
  }
}

export default {
  createHabitSeriesEndpoint,
  deleteHabitSeriesEndpoint,
  setDependencies,
};
