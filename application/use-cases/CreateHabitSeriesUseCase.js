/**
 * Create Habit Series Use Case (Application Layer)
 *
 * ARCHITECTURE: Hexagonal (Ports & Adapters)
 * DATE: 2026-01-19
 *
 * Orchestrates the full flow of habit series creation via AI.
 *
 * Flow:
 * 1. Pre-AI validation (plan, feature access, limit, energy)
 * 2. AI execution (3 passes: creative → structure → schema)
 * 3. Post-AI validation (schema compliance)
 * 4. Persistence
 * 5. Counter increment
 * 6. Return success result
 *
 * Dependencies (injected):
 * - userRepository: IUserRepository
 * - habitSeriesRepository: IHabitSeriesRepository
 * - energyRepository: IEnergyRepository
 * - aiProvider: IAIProvider
 */

import { hasFeatureAccess, getPlan } from '../../domain/policies/PlanPolicy.js';
import { getModelConfig } from '../../domain/policies/ModelSelectionPolicy.js';
import { generateAIResponse } from '../services/AIExecutionService.js';
import { ValidationError, AuthorizationError } from '../errors/index.js';
import { InsufficientEnergyError } from '../../domain/errors/index.js';

import CreativeHabitSeriesPrompt from '../prompts/habit_series/CreativeHabitSeriesPrompt.js';
import StructureHabitSeriesPrompt from '../prompts/habit_series/StructureHabitSeriesPrompt.js';
import JsonSchemaHabitSeriesPrompt from '../prompts/habit_series/JsonSchemaHabitSeriesPrompt.js';

/**
 * Expected schema for habit series
 */
const HABIT_SERIES_SCHEMA = {
  type: 'object',
  required: ['titulo', 'descripcion', 'acciones'],
  properties: {
    titulo: { type: 'string' },
    descripcion: { type: 'string' },
    acciones: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        required: ['nombre', 'descripcion', 'dificultad'],
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          dificultad: { type: 'string' }
        }
      }
    }
  }
};

/**
 * Determine effective plan considering trial status
 */
function determineEffectivePlan(user) {
  let effectivePlan = user.plan || 'freemium';
  if (effectivePlan === 'freemium' && user.trial?.activo) {
    effectivePlan = 'trial';
  }
  return effectivePlan;
}

/**
 * Validate that parsed data matches expected schema
 */
function validateSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is not an object' };
  }

  if (typeof data.titulo !== 'string' || !data.titulo.trim()) {
    return { valid: false, error: 'Missing or invalid titulo' };
  }

  if (typeof data.descripcion !== 'string' || !data.descripcion.trim()) {
    return { valid: false, error: 'Missing or invalid descripcion' };
  }

  if (!Array.isArray(data.acciones)) {
    return { valid: false, error: 'acciones must be an array' };
  }

  if (data.acciones.length < 3 || data.acciones.length > 5) {
    return { valid: false, error: 'acciones must have between 3 and 5 items' };
  }

  for (let i = 0; i < data.acciones.length; i++) {
    const action = data.acciones[i];
    if (!action || typeof action !== 'object') {
      return { valid: false, error: `acciones[${i}] is not an object` };
    }
    if (typeof action.nombre !== 'string' || !action.nombre.trim()) {
      return { valid: false, error: `acciones[${i}].nombre is missing or invalid` };
    }
    if (typeof action.descripcion !== 'string' || !action.descripcion.trim()) {
      return { valid: false, error: `acciones[${i}].descripcion is missing or invalid` };
    }
    if (typeof action.dificultad !== 'string' || !action.dificultad.trim()) {
      return { valid: false, error: `acciones[${i}].dificultad is missing or invalid` };
    }
  }

  return { valid: true };
}

/**
 * Create a habit series via AI
 *
 * @param {string} userId - User ID
 * @param {Object} payload - Request payload
 * @param {string} payload.language - Language code ('en' | 'es')
 * @param {string} payload.assistantContext - Serialized assistant context
 * @param {Record<string, string>} payload.testData - User test responses
 * @param {Object} payload.difficultyLabels - Difficulty label translations
 * @param {Object} deps - Injected dependencies
 * @returns {Promise<{success: true, seriesId: string, titulo: string}>}
 */
export async function createHabitSeries(userId, payload, deps) {
  const { userRepository, habitSeriesRepository, energyRepository, aiProvider } = deps;

  // Validate dependencies
  if (!userRepository) {
    throw new ValidationError('Dependency required: userRepository');
  }
  if (!habitSeriesRepository) {
    throw new ValidationError('Dependency required: habitSeriesRepository');
  }
  if (!energyRepository) {
    throw new ValidationError('Dependency required: energyRepository');
  }
  if (!aiProvider) {
    throw new ValidationError('Dependency required: aiProvider');
  }

  // Validate payload
  if (!payload?.language || !payload?.testData || !payload?.difficultyLabels) {
    throw new ValidationError('Missing required payload fields: language, testData, difficultyLabels');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: PRE-AI VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  // 1.1 Load user
  const user = await userRepository.getUser(userId);
  if (!user) {
    throw new ValidationError('USER_NOT_FOUND');
  }

  // 1.2 Determine effective plan
  const effectivePlan = determineEffectivePlan(user);
  const planConfig = getPlan(effectivePlan, user.trial?.activo);

  // 1.3 Validate feature access
  const hasAccess = hasFeatureAccess(effectivePlan, 'habits.series.create');
  if (!hasAccess) {
    throw new AuthorizationError(
      `Plan ${effectivePlan} does not have access to habits.series.create`
    );
  }

  // 1.4 Validate active series limit
  const limits = user.limits || {};
  const activeSeriesCount = limits.activeSeriesCount || 0;
  const maxActiveSeries = planConfig.maxActiveSeries || 0;

  if (activeSeriesCount >= maxActiveSeries) {
    throw new AuthorizationError(
      `Active series limit reached: ${activeSeriesCount}/${maxActiveSeries}`
    );
  }

  // 1.5 Validate energy availability
  const energyData = await energyRepository.getEnergy(userId);
  if (!energyData || energyData.actual <= 0) {
    throw new InsufficientEnergyError(1, energyData?.actual || 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: AI EXECUTION (3 passes)
  // ═══════════════════════════════════════════════════════════════════════

  const { language, assistantContext, testData, difficultyLabels } = payload;

  // Pass 1: Creative generation (human-readable text)
  const creativeMessages = CreativeHabitSeriesPrompt({
    language,
    assistantContext: assistantContext || '',
    testData,
    difficultyLabels
  });

  const creativeConfig = getModelConfig('habit_series_creative');
  const creativeResponse = await generateAIResponse(
    userId,
    creativeMessages,
    {
      model: creativeConfig.model,
      temperature: creativeConfig.temperature,
      maxTokens: creativeConfig.maxTokens,
      forceJson: false
    },
    { aiProvider, energyRepository }
  );

  const rawCreativeText = creativeResponse.content;

  // Pass 2: Structure extraction (text → JSON)
  const structureMessages = StructureHabitSeriesPrompt({
    language,
    rawText: rawCreativeText,
    difficultyLabels
  });

  const structureConfig = getModelConfig('habit_series_structure');
  const structureResponse = await generateAIResponse(
    userId,
    structureMessages,
    {
      model: structureConfig.model,
      temperature: structureConfig.temperature,
      maxTokens: structureConfig.maxTokens,
      forceJson: true
    },
    { aiProvider, energyRepository }
  );

  const rawStructuredText = structureResponse.content;

  // Pass 3: Schema enforcement (strict JSON validation)
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
      forceJson: true
    },
    { aiProvider, energyRepository }
  );

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: POST-AI VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  let parsedSeries;
  try {
    parsedSeries = typeof schemaResponse.content === 'string'
      ? JSON.parse(schemaResponse.content)
      : schemaResponse.content;
  } catch (parseError) {
    throw new ValidationError(`AI output is not valid JSON: ${parseError.message}`);
  }

  const schemaValidation = validateSchema(parsedSeries);
  if (!schemaValidation.valid) {
    throw new ValidationError(`AI output schema validation failed: ${schemaValidation.error}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  const persistResult = await habitSeriesRepository.createFromAI(userId, parsedSeries);
  const seriesId = persistResult.id;

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: SIDE EFFECTS (counter increment)
  // ═══════════════════════════════════════════════════════════════════════

  await userRepository.incrementActiveSeries(userId);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 6: RETURN SUCCESS RESULT
  // ═══════════════════════════════════════════════════════════════════════

  return {
    success: true,
    seriesId,
    titulo: parsedSeries.titulo,
    message: 'Habit series created successfully'
  };
}

export default { createHabitSeries };
