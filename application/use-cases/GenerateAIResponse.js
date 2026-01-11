/**
 * Generate AI Response Use Case (Domain)
 *
 * MIGRADO DESDE: src/services/aiService.js (líneas 87-417)
 * REFACTORIZADO: 2025-12-30
 * EXTRACCIÓN: Orquestación de generación de respuestas IA
 *
 * Responsabilidades:
 * - Validar energía disponible ANTES de llamar a IA
 * - Seleccionar modelo según function_type (vía ModelSelectionPolicy)
 * - Coordinar con IAIProvider (port) para generar respuesta
 * - Calcular energía consumida
 * - Coordinar con IEnergyRepository (port) para consumir energía
 *
 * NO contiene:
 * - Llamadas directas a OpenAI/Gemini
 * - SDKs
 * - Lógica de Firestore
 * - HTTP
 * - Construcción de prompts (eso es responsabilidad del frontend)
 *
 * ELIMINADO:
 * - convertToJSON → El frontend debe construir el prompt de conversión JSON y llamar a /chat
 */

import { getModelConfig } from '../policies/ModelSelectionPolicy.js';
import { canConsumeEnergy } from '../entities/Energy.js';
import { isHabitSeriesFinal } from '../policies/HabitSeriesPolicy.js';
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
