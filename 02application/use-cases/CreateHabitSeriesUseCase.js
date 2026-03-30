/**
 * Layer: Application
 * File: CreateHabitSeriesUseCase.js
 * Responsibility:
 * Orchestrates AI-driven habit series creation with pre-AI validation, three-pass AI execution, and atomic persistence.
 */

import { getPlanLimits } from '../../01domain/policies/PlanPolicy.js';
import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { generateAIResponse } from '../services/AIExecutionService.js';
import {
  ValidationError,
  AuthorizationError,
  MaxActiveSeriesReachedError,
} from '../../errors/Index.js';

import CreativeHabitSeriesPrompt from '../prompts/habit_series_prompts/CreativeHabitSeriesPrompt.js';
import StructureHabitSeriesPrompt from '../prompts/habit_series_prompts/StructureHabitSeriesPrompt.js';
import { mapAIOutputToHabitSeries } from '../mappers/HabitSeriesFromAIMapper.js';
import { sanitizeUserInput } from '../input/SanitizeUserInput.js';

function validateSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is not an object' };
  }

  if (typeof data.title !== 'string' || !data.title.trim()) {
    return { valid: false, error: 'Missing or invalid title' };
  }

  if (typeof data.description !== 'string' || !data.description.trim()) {
    return { valid: false, error: 'Missing or invalid description' };
  }

  if (!Array.isArray(data.actions)) {
    return { valid: false, error: 'actions must be an array' };
  }

  if (data.actions.length < 3 || data.actions.length > 5) {
    return { valid: false, error: 'actions must have between 3 and 5 items' };
  }

  for (let i = 0; i < data.actions.length; i++) {
    const action = data.actions[i];
    if (!action || typeof action !== 'object') {
      return { valid: false, error: `actions[${i}] is not an object` };
    }
    if (typeof action.name !== 'string' || !action.name.trim()) {
      return { valid: false, error: `actions[${i}].name is missing or invalid` };
    }
    if (typeof action.description !== 'string' || !action.description.trim()) {
      return { valid: false, error: `actions[${i}].description is missing or invalid` };
    }
    if (!['low', 'medium', 'high'].includes(action.difficulty)) {
      return { valid: false, error: `actions[${i}].difficulty must be one of: low, medium, high` };
    }
  }

  return { valid: true };
}

/**
 * Create a habit series via AI.
 *
 * Executes three AI passes then atomically persists the series
 * and increments the counter. No partial state is possible.
 *
 * @param {string} userId - User ID
 * @param {Object} payload - Request payload
 * @param {string} payload.language - Language code ('en' | 'es')
 * @param {string} payload.assistantContext - Serialized assistant context
 * @param {Record<string, string>} payload.testData - User test responses
 * @param {Object} deps - Injected dependencies
 * @returns {Promise<HabitSeries>} The habit series domain entity
 */
export async function createHabitSeries(userId, payload, deps) {
  const { userRepository, habitSeriesRepository, aiProvider, planId, requestId = undefined } = deps;

  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }
  if (!habitSeriesRepository) {
    throw new ValidationError('Dependency required: habitSeriesRepository');
  }
  if (!aiProvider) {
    throw new ValidationError('Dependency required: aiProvider');
  }

  if (!payload?.language || !payload?.testData) {
    throw new ValidationError('Missing required payload fields: language, testData');
  }

  const pipelineStart = Date.now();
  console.log(JSON.stringify({ level: 'info', event: 'pipeline.start', ts: new Date().toISOString(), pipeline: 'habit_series', userId, requestId }));

  try {
    // STEP 1: PRE-AI VALIDATION

    // planId is null when trial has expired or user has no active subscription
    if (!planId) {
      throw new AuthorizationError('No active plan. Access denied.');
    }

    const planLimits = getPlanLimits(planId);

    const user = await userRepository.getUser(userId);
    if (!user) {
      throw new ValidationError('USER_NOT_FOUND');
    }

    const activeSeriesCount = user.limits?.activeSeriesCount || 0;

    if (activeSeriesCount >= planLimits.maxActiveSeries) {
      throw new MaxActiveSeriesReachedError(planLimits.maxActiveSeries, activeSeriesCount);
    }

    // STEP 2: AI EXECUTION (3 passes)

    const { language, assistantContext, testData } = payload;

    // Sanitize before any AI processing to prevent prompt injection
    const sanitizedTestData = Object.fromEntries(
      Object.entries(testData).map(([key, value]) => [key, sanitizeUserInput(value)])
    );
    const sanitizedContext = assistantContext ? sanitizeUserInput(assistantContext) : '';

    // Pass 1 — creative: generate free-form human-readable content
    const creativeMessages = CreativeHabitSeriesPrompt({
      language,
      assistantContext: sanitizedContext,
      testData: sanitizedTestData
    });

    const creativeConfig = getModelConfig('habit_series_creative');
    const creativeResponse = await generateAIResponse(
      userId,
      creativeMessages,
      {
        model: creativeConfig.model,
        temperature: creativeConfig.temperature,
        maxTokens: creativeConfig.maxTokens,
        forceJson: false,
        step: 'creative',
        requestId,
        pipeline: 'habit_series',
      },
      { aiProvider }
    );

    const rawCreativeText = creativeResponse.content;

    // Pass 2 — structure: extract JSON from creative text
    const structureMessages = StructureHabitSeriesPrompt({
      language,
      rawText: rawCreativeText
    });

    const structureConfig = getModelConfig('habit_series_structure');
    const structureResponse = await generateAIResponse(
      userId,
      structureMessages,
      {
        model: structureConfig.model,
        temperature: structureConfig.temperature,
        maxTokens: structureConfig.maxTokens,
        forceJson: true,
        step: 'structure',
        requestId,
        pipeline: 'habit_series',
      },
      { aiProvider }
    );

    // STEP 3: POST-AI VALIDATION

    let parsedSeries;
    try {
      parsedSeries = typeof structureResponse.content === 'string'
        ? JSON.parse(structureResponse.content)
        : structureResponse.content;
    } catch (parseError) {
      throw new ValidationError(`AI output is not valid JSON: ${parseError.message}`);
    }

    const schemaValidation = validateSchema(parsedSeries);
    if (!schemaValidation.valid) {
      throw new ValidationError(`AI output schema validation failed: ${schemaValidation.error}`);
    }

    // STEP 4: ATOMIC COMMIT — persist series and increment counter in one transaction

    let seriesId;
    try {
      const persistResult = await habitSeriesRepository.atomicCommitCreation(
        userId,
        parsedSeries
      );
      seriesId = persistResult.id;
    } catch (error) {
      throw error;
    }

    console.log(JSON.stringify({
      level: 'info',
      event: 'quota.consumed',
      ts: new Date().toISOString(),
      resource: 'active_series',
      userId,
      planId,
      count_before: activeSeriesCount,
      count_after: activeSeriesCount + 1,
      requestId,
    }));

    console.log(JSON.stringify({
      level: 'info',
      event: 'pipeline.end',
      ts: new Date().toISOString(),
      pipeline: 'habit_series',
      userId,
      duration_ms: Date.now() - pipelineStart,
      requestId,
    }));

    // STEP 5: MAP AND RETURN DOMAIN ENTITY

    const habitSeries = mapAIOutputToHabitSeries(seriesId, parsedSeries);

    return habitSeries;

  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'pipeline.failure',
      ts: new Date().toISOString(),
      pipeline: 'habit_series',
      userId,
      errorCode: err.code || err.name,
      message: err.message,
      requestId,
    }));
    throw err;
  }
}

export default { createHabitSeries };
