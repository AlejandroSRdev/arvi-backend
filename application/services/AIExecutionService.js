/**
 * AIExecutionService (Application Service)
 *
 * MIGRATION DATE: 2026-01-13
 *
 * Architectural role:
 * Application-level service responsible for executing AI calls in a
 * controlled, safe, and reusable manner, without knowledge of business
 * intent or product-specific semantics.
 *
 * This service encapsulates:
 * - Energy validation and consumption associated with AI calls
 * - Technical model selection (via ModelSelectionPolicy)
 * - Coordination with AI providers through ports (IAIProvider)
 *
 * Responsibilities:
 * - Validate available energy before executing AI calls
 * - Select model configuration based on functionType
 * - Execute AI requests via ports (no direct SDK usage)
 * - Calculate and persist energy consumption
 *
 * Out of scope (explicitly NOT responsible for):
 * - Prompt construction
 * - JSON schema definition or validation
 * - Parsing AI output into domain entities
 * - Business flow orchestration
 * - Product-level decision making
 * - HTTP, controllers, authentication, or request handling
 *
 * Dependencies:
 * - ModelSelectionPolicy (domain)
 * - Energy entity and policies (domain)
 * - IAIProvider (port)
 * - IEnergyRepository (port)
 *
 * Note:
 * This is a transversal, reusable application service.
 * It does not represent a business use case by itself.
 */


import { getModelConfig } from '../../domain/policies/ModelSelectionPolicy.js';
import { canConsumeEnergy } from '../../domain/entities/Energy.js';
import { isHabitSeriesFinal } from '../../domain/policies/HabitSeriesPolicy.js';
import { ValidationError } from '../errors/index.js';
import { InsufficientEnergyError } from '../../domain/errors/index.js';

/**
 * Generar respuesta de IA con consumo de energía
 *
 * MIGRADO DESDE: src/services/aiService.js:callAI (líneas 87-201)
 * AJUSTADO: 2025-12-30 - Usar nuevo puerto IEnergyRepository.updateEnergy()
 *
 * @param {string} userId - ID del usuario
 * @param {Array<Object>} messages - Array de mensajes [{role, content}]
 * @param {Object} options - Opciones {model, temperature, maxTokens, forceJson}
 * @param {Object} deps - Dependencias inyectadas {aiProvider: IAIProvider, energyRepository: IEnergyRepository}
 * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
 */
export async function generateAIResponse(userId, messages, options = {}, deps) {
  const { aiProvider, energyRepository } = deps;

  if (!aiProvider || !energyRepository) {
    throw new ValidationError('Dependencies required: aiProvider, energyRepository');
  }

  const {
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 1500,
    forceJson = false,
  } = options;

  // 1. VALIDAR ENERGÍA ANTES DE LLAMAR (crítico: evita gasto innecesario)
  const energyData = await energyRepository.getEnergy(userId);

  if (!energyData || energyData.actual <= 0) {
    throw new InsufficientEnergyError(1, energyData?.actual || 0);
  }

  // 2. LLAMAR A IA VÍA PORT
  const response = await aiProvider.callAI(userId, messages, {
    model,
    temperature,
    maxTokens,
    forceJson,
  });

  // 3. CONSUMIR ENERGÍA (solo si se consumió energía según respuesta del provider)
  if (response.energyConsumed > 0) {
    // Validar que tenga suficiente energía (función pura de entity)
    if (!canConsumeEnergy(energyData.actual, response.energyConsumed)) {
      throw new InsufficientEnergyError(response.energyConsumed, energyData.actual);
    }

    // Calcular nueva energía aquí (NO en el repo)
    const nuevaEnergia = energyData.actual - response.energyConsumed;
    const nuevoConsumoTotal = (energyData.consumoTotal || 0) + response.energyConsumed;

    await energyRepository.updateEnergy(userId, {
      actual: nuevaEnergia,
      consumoTotal: nuevoConsumoTotal
    }, `AI_CALL_${model}`);
  }

  return response;
}

/**
 * Generar respuesta de IA con selección automática de modelo según function_type
 *
 * MIGRADO DESDE: src/services/aiService.js:callAIWithFunctionType (líneas 212-233)
 * EXTENDIDO: 2026-01-09 - Persistencia automática de series de hábitos finales
 *
 * @param {string} userId - ID del usuario
 * @param {Array<Object>} messages - Array de mensajes [{role, content}]
 * @param {string} functionType - Tipo de función (home_phrase, chat, etc.)
 * @param {Object} deps - Dependencias inyectadas {aiProvider, energyRepository, habitSeriesRepository?}
 * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
 */
export async function generateAIResponseWithFunctionType(userId, messages, functionType, deps) {
  const { habitSeriesRepository } = deps;
  const config = getModelConfig(functionType);

  const response = await generateAIResponse(userId, messages, {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    forceJson: config.forceJson || false,
  }, deps);

  // DECISIÓN DE DOMINIO: persistir serie final automáticamente
  if (isHabitSeriesFinal(functionType)) {
    if (!habitSeriesRepository) {
      throw new ValidationError('HabitSeriesRepository not provided');
    }

    await habitSeriesRepository.createFromAI(userId, response.content);
  }

  return response;
}

export default {
  generateAIResponse,
  generateAIResponseWithFunctionType,
};
