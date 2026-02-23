/**
 * Layer: Application
 * File: CreateHabitSeriesUseCase.js
 * Responsibility:
 * Orchestrates AI-driven habit series creation with pre-AI validation, three-pass AI execution, and atomic persistence of series and energy.
 */

import { hasFeatureAccess, getPlan } from '../../01domain/policies/PlanPolicy.js';
import { getModelConfig } from '../../01domain/policies/ModelSelectionPolicy.js';
import { generateAIResponse } from '../services/AIExecutionService.js';
import {
  ValidationError,
  AuthorizationError,
  InsufficientEnergyError,
  MaxActiveSeriesReachedError,
} from '../../errors/Index.js';

import CreativeHabitSeriesPrompt from '../prompts/habit_series_prompts/CreativeHabitSeriesPrompt.js';
import StructureHabitSeriesPrompt from '../prompts/habit_series_prompts/StructureHabitSeriesPrompt.js';
import JsonSchemaHabitSeriesPrompt from '../prompts/habit_series_prompts/JsonSchemaHabitSeriesPrompt.js';
import { mapAIOutputToHabitSeries } from '../mappers/HabitSeriesFromAIMapper.js';
import { sanitizeUserInput } from '../input/SanitizeUserInput.js';

const HABIT_SERIES_SCHEMA = {
  type: 'object',
  required: ['title', 'description', 'actions'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    actions: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        required: ['name', 'description', 'difficulty'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          difficulty: { type: 'string' }
        }
      }
    }
  }
};

function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';
  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }
  return effectivePlan;
}

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
    if (typeof action.difficulty !== 'string' || !action.difficulty.trim()) {
      return { valid: false, error: `actions[${i}].difficulty is missing or invalid` };
    }
  }

  return { valid: true };
}

/**
 * Create a habit series via AI with atomic energy consumption.
 *
 * Energy is accumulated in memory during AI passes and deducted
 * in a single atomic transaction together with persistence and
 * counter increment. No partial state is possible.
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
  console.log(`[USE-CASE] [Habit Series] CreateHabitSeries started for user ${userId}`);

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

  if (!payload?.language || !payload?.testData) {
    throw new ValidationError('Missing required payload fields: language, testData');
  }

  // STEP 1: PRE-AI VALIDATION

  const user = await userRepository.getUser(userId);
  if (!user) {
    throw new ValidationError('USER_NOT_FOUND');
  }

  const effectivePlan = determineEffectivePlan(user);
  const planConfig = getPlan(effectivePlan, user.trial?.activo);

  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.create');
  if (!hasAccess) {
    throw new AuthorizationError(
      `Plan ${effectivePlan} does not have access to habits.series.create`
    );
  }

  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = planConfig.maxActiveSeries || 0;

  if (activeSeriesCount >= maxActiveSeries) {
    throw new MaxActiveSeriesReachedError(maxActiveSeries, activeSeriesCount);
  }

  // Read-only pre-check — energy is not deducted until the atomic commit
  const currentEnergy = user.energy?.currentAmount || 0;
  if (currentEnergy <= 0) {
    throw new InsufficientEnergyError(1, currentEnergy);
  }

  // STEP 2: AI EXECUTION (3 passes) — energy accumulated in memory, not deducted yet

  const { language, assistantContext, testData } = payload;
  let totalEnergyConsumed = 0;

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
      step: 'creative'
    },
    { aiProvider }
  );

  totalEnergyConsumed += creativeResponse.energyConsumed;
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
      step: 'structure'
    },
    { aiProvider }
  );

  totalEnergyConsumed += structureResponse.energyConsumed;
  const rawStructuredText = structureResponse.content;

  // Pass 3 — schema: enforce strict JSON schema compliance
  const schemaMessages = JsonSchemaHabitSeriesPrompt({
    content: rawStructuredText,
    schema: HABIT_SERIES_SCHEMA
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

  totalEnergyConsumed += schemaResponse.energyConsumed;

  console.log('[ENERGY_ACCUMULATED]', {
    totalEnergyConsumed,
    userId,
    timestamp: new Date().toISOString()
  });

  // STEP 3: POST-AI VALIDATION

  let parsedSeries;
  try {
    parsedSeries = typeof schemaResponse.content === 'string'
      ? JSON.parse(schemaResponse.content)
      : schemaResponse.content;
  } catch (parseError) {
    throw new ValidationError(`AI output is not valid JSON: ${parseError.message}`);
  }

  const actionCount = Array.isArray(parsedSeries?.acciones) ? parsedSeries.acciones.length : 0;
  console.log(`[SCHEMA] [Habit Series] Validating AI output against schema, actions=${actionCount}`);

  const schemaValidation = validateSchema(parsedSeries);
  if (!schemaValidation.valid) {
    console.error(`[SCHEMA ERROR] [Habit Series] Schema validation failed: ${schemaValidation.error}`);
    throw new ValidationError(`AI output schema validation failed: ${schemaValidation.error}`);
  }

  console.log('[SCHEMA] [Habit Series] Schema validation OK');

  // STEP 4: ATOMIC COMMIT — persist series, deduct energy, and increment counter in one transaction

  console.log('[ATOMIC_COMMIT_START]', {
    userId,
    totalEnergyConsumed,
    timestamp: new Date().toISOString()
  });

  let seriesId;
  try {
    const persistResult = await habitSeriesRepository.atomicCommitCreation(
      userId,
      parsedSeries,
      totalEnergyConsumed
    );
    seriesId = persistResult.id;

    console.log('[ATOMIC_COMMIT_SUCCESS]', {
      userId,
      totalEnergyConsumed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ATOMIC_COMMIT_FAILURE]', {
      userId,
      totalEnergyConsumed,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }

  // STEP 5: MAP AND RETURN DOMAIN ENTITY

  const habitSeries = mapAIOutputToHabitSeries(seriesId, parsedSeries);

  return habitSeries;
}

export default { createHabitSeries };
