/**
 * Layer: Application
 * File: CreateActionUseCase.js
 * Responsibility:
 * Orchestrates AI-driven habit action creation with pre-AI validation, three-pass AI execution,
 * and atomic persistence. Uses monthly usage limits instead of energy.
 */
import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { generateAIResponse } from '../services/AIExecutionService.js';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  MonthlyActionsQuotaExceededError,
} from '../../errors/Index.js';

import CreativeActionPrompt from '../prompts/action_prompts/CreativeActionPrompt.js';
import StructureActionPrompt from '../prompts/action_prompts/StructureActionPrompt.js';
import { Action } from '../../01domain/value_objects/habits/Action.js';
import { parseDifficulty } from '../../01domain/value_objects/habits/Difficulty.js';

const VALID_DIFFICULTIES = ['low', 'medium', 'high'];

function getNextDifficulty(actions) {
  if (!actions || actions.length === 0) return "low";

  const last = actions[actions.length - 1].difficulty;

  if (last === "low") return "medium";
  if (last === "medium") return "high";
  if (last === "high") return "low";

  return "medium";
}

function validateActionSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is not an object' };
  }

  if (typeof data.name !== 'string' || !data.name.trim()) {
    return { valid: false, error: 'Missing or invalid name' };
  }

  if (typeof data.description !== 'string' || !data.description.trim()) {
    return { valid: false, error: 'Missing or invalid description' };
  }

  if (!VALID_DIFFICULTIES.includes(data.difficulty)) {
    return { valid: false, error: `Missing or invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Create a new habit action via AI.
 *
 * Executes three AI passes then atomically appends the action to the series
 * and increments the monthly usage counter. No partial state is possible.
 *
 * @param {string} userId - User ID
 * @param {string} seriesId - Target habit series ID
 * @param {Object} payload - Request payload
 * @param {string} payload.language - Language code ('en' | 'es')
 * @param {Object} deps - Injected dependencies
 * @returns {Promise<Action>} The created action domain entity
 */
export async function createAction(userId, seriesId, payload, deps) {
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

  if (!payload?.language) {
    throw new ValidationError('Missing required payload field: language');
  }

  const pipelineStart = Date.now();
  console.log(JSON.stringify({ level: 'info', event: 'pipeline.start', ts: new Date().toISOString(), pipeline: 'action', userId, requestId }));

  try {
    // STEP 1: PRE-AI VALIDATION

    const user = await userRepository.getUser(userId);
    if (!user) {
      throw new ValidationError('USER_NOT_FOUND');
    }

    // planId is null when trial has expired or user has no active subscription
    if (!planId) {
      throw new AuthorizationError('No active plan. Access denied.');
    }

    // Check quota before any further DB calls or AI execution to fail fast
    const monthlyRemaining = user.limits?.monthlyActionsRemaining ?? 0;
    if (monthlyRemaining <= 0) {
      throw new MonthlyActionsQuotaExceededError(user.limits?.monthlyActionsMax ?? 0);
    }

    const series = await habitSeriesRepository.getHabitSeriesById(userId, seriesId);
    if (!series) {
      throw new NotFoundError('Habit series not found');
    }

    // STEP 2: AI EXECUTION (3 passes)

    const { language } = payload;

    // Difficulty is fully deterministic: cycles low → medium → high → low ...
    const difficulty = getNextDifficulty(series.actions);

    // Pass 1 — creative: generate free-form human-readable action content
    const creativeMessages = CreativeActionPrompt({ language, series, difficulty });

    const creativeConfig = getModelConfig('action_creative');
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
        pipeline: 'action',
      },
      { aiProvider }
    );

    const rawCreativeText = creativeResponse.content;

    // Pass 2 — structure: extract JSON from creative text
    const structureMessages = StructureActionPrompt({ language, rawText: rawCreativeText, difficulty });

    const structureConfig = getModelConfig('action_structure');
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
        pipeline: 'action',
      },
      { aiProvider }
    );

    // STEP 3: POST-AI VALIDATION

    let parsedAction;
    try {
      parsedAction = typeof structureResponse.content === 'string'
        ? JSON.parse(structureResponse.content)
        : structureResponse.content;
    } catch (parseError) {
      throw new ValidationError(`AI output is not valid JSON: ${parseError.message}`);
    }

    const schemaValidation = validateActionSchema(parsedAction);
    if (!schemaValidation.valid) {
      throw new ValidationError(`AI output schema validation failed: ${schemaValidation.error}`);
    }

    // STEP 4: ATOMIC COMMIT — append action and increment monthly usage in one transaction

    const actionId = `${seriesId}_action_${Date.now()}`;

    const actionData = {
      id: actionId,
      name: parsedAction.name,
      description: parsedAction.description,
      difficulty: parseDifficulty(parsedAction.difficulty),
    };

    try {
      await habitSeriesRepository.atomicCommitActionCreation(
        userId,
        seriesId,
        actionData
      );
    } catch (error) {
      throw error;
    }

    console.log(JSON.stringify({
      level: 'info',
      event: 'quota.consumed',
      ts: new Date().toISOString(),
      resource: 'monthly_actions',
      userId,
      planId,
      remaining: monthlyRemaining - 1,
      requestId,
    }));

    console.log(JSON.stringify({
      level: 'info',
      event: 'pipeline.end',
      ts: new Date().toISOString(),
      pipeline: 'action',
      userId,
      duration_ms: Date.now() - pipelineStart,
      requestId,
    }));

    // STEP 5: MAP AND RETURN DOMAIN ENTITY

    const action = Action.create(actionData);

    return action;

  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'pipeline.failure',
      ts: new Date().toISOString(),
      pipeline: 'action',
      userId,
      errorCode: err.code || err.name,
      message: err.message,
      requestId,
    }));
    throw err;
  }
}

export default { createAction };
