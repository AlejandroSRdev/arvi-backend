/**
 * Layer: Application
 * File: CreateActionUseCase.js
 * Responsibility:
 * Orchestrates AI-driven habit action creation with pre-AI validation, three-pass AI execution,
 * and atomic persistence. Uses monthly usage limits instead of energy.
 */

import { hasFeatureAccess, getPlan, monthlyActionsLimit } from '../../01domain/policies/PlanPolicy.js';
import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { generateAIResponse } from '../services/AIExecutionService.js';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} from '../../errors/Index.js';

import CreativeActionPrompt from '../prompts/action_prompts/CreativeActionPrompt.js';
import StructureActionPrompt from '../prompts/action_prompts/StructureActionPrompt.js';
import JsonSchemaHabitSeriesPrompt from '../prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js';
import { Action } from '../../01domain/value_objects/habits/Action.js';
import { parseDifficulty } from '../../01domain/value_objects/habits/Difficulty.js';

const VALID_DIFFICULTIES = ['low', 'medium', 'high'];

const ACTION_SCHEMA = {
  type: 'object',
  required: ['name', 'description', 'difficulty'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    difficulty: { type: 'string', enum: VALID_DIFFICULTIES },
  }
};

function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';
  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }
  return effectivePlan;
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

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  console.log(`[USE-CASE] [Action] CreateAction started for user ${userId}, series ${seriesId}`);

  const { userRepository, habitSeriesRepository, aiProvider } = deps;

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

  // STEP 1: PRE-AI VALIDATION

  const user = await userRepository.getUser(userId);
  if (!user) {
    throw new ValidationError('USER_NOT_FOUND');
  }

  const effectivePlan = determineEffectivePlan(user);

  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.actions.create');
  if (!hasAccess) {
    throw new AuthorizationError(
      `Plan ${effectivePlan} does not have access to habit action creation`
    );
  }

  const series = await habitSeriesRepository.getHabitSeriesById(userId, seriesId);
  if (!series) {
    throw new NotFoundError('Habit series not found');
  }

  const monthKey = getCurrentMonthKey();
  const monthlyUsage = await habitSeriesRepository.getMonthlyUsage(userId, monthKey);
  const actionsUsed = monthlyUsage?.actionsUsed ?? 0;
  const limit = monthlyActionsLimit(effectivePlan);

  if (actionsUsed >= limit) {
    throw new AuthorizationError(`Monthly action limit of ${limit} reached`);
  }

  // STEP 2: AI EXECUTION (3 passes)

  const { language } = payload;

  // Pass 1 — creative: generate free-form human-readable action content
  const creativeMessages = CreativeActionPrompt({ language, series });

  const creativeConfig = getModelConfig('action_creative');
  const creativeResponse = await generateAIResponse(
    userId,
    creativeMessages,
    {
      model: creativeConfig.model,
      temperature: creativeConfig.temperature,
      maxTokens: creativeConfig.maxTokens,
      forceJson: false,
      step: 'creative'
    },
    { aiProvider }
  );

  const rawCreativeText = creativeResponse.content;

  // Pass 2 — structure: extract JSON from creative text
  const structureMessages = StructureActionPrompt({ language, rawText: rawCreativeText });

  const structureConfig = getModelConfig('action_structure');
  const structureResponse = await generateAIResponse(
    userId,
    structureMessages,
    {
      model: structureConfig.model,
      temperature: structureConfig.temperature,
      maxTokens: structureConfig.maxTokens,
      forceJson: true,
      step: 'structure'
    },
    { aiProvider }
  );

  const rawStructuredText = structureResponse.content;

  // Pass 3 — schema: enforce strict JSON schema compliance
  const schemaMessages = JsonSchemaHabitSeriesPrompt({
    content: rawStructuredText,
    schema: ACTION_SCHEMA
  });

  const schemaConfig = getModelConfig('json_conversion');
  const schemaResponse = await generateAIResponse(
    userId,
    schemaMessages,
    {
      model: schemaConfig.model,
      temperature: schemaConfig.temperature,
      maxTokens: schemaConfig.maxTokens,
      forceJson: true,
      step: 'schema'
    },
    { aiProvider }
  );

  // STEP 3: POST-AI VALIDATION

  let parsedAction;
  try {
    parsedAction = typeof schemaResponse.content === 'string'
      ? JSON.parse(schemaResponse.content)
      : schemaResponse.content;
  } catch (parseError) {
    throw new ValidationError(`AI output is not valid JSON: ${parseError.message}`);
  }

  console.log('[SCHEMA] [Action] Validating AI output against schema');

  const schemaValidation = validateActionSchema(parsedAction);
  if (!schemaValidation.valid) {
    console.error(`[SCHEMA ERROR] [Action] Schema validation failed: ${schemaValidation.error}`);
    throw new ValidationError(`AI output schema validation failed: ${schemaValidation.error}`);
  }

  console.log('[SCHEMA] [Action] Schema validation OK');

  // STEP 4: ATOMIC COMMIT — append action and increment monthly usage in one transaction

  const actionId = `${seriesId}_action_${Date.now()}`;

  const actionData = {
    id: actionId,
    name: parsedAction.name,
    description: parsedAction.description,
    difficulty: parseDifficulty(parsedAction.difficulty),
    score: 0,
    completed: false,
    completedAt: null,
    verificationResponse: null,
    bonusPoints: 0,
  };

  console.log('[ATOMIC_COMMIT_START]', {
    userId,
    seriesId,
    actionId,
    timestamp: new Date().toISOString()
  });

  try {
    await habitSeriesRepository.atomicCommitActionCreation(
      userId,
      seriesId,
      actionData,
      monthKey,
      limit
    );

    console.log('[ATOMIC_COMMIT_SUCCESS]', {
      userId,
      seriesId,
      actionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ATOMIC_COMMIT_FAILURE]', {
      userId,
      seriesId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }

  // STEP 5: MAP AND RETURN DOMAIN ENTITY

  const action = Action.create(actionData);

  return action;
}

export default { createAction };
