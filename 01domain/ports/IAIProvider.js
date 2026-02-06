/**
 * AI Provider Port (Interface)
 *
 * PATRÓN: Hexagonal Architecture - Port
 * REFACTORIZADO: 2025-12-30
 * ALINEADO CON: frontend-reference/services/ai_service_refactor2.dart
 *
 * Define QUÉ necesita el BACKEND (sistema) para interactuar con servicios de IA.
 * NO define lógica de producto (prompts, flujos multi-pasada, etc.)
 *
 * RESPONSABILIDAD:
 * - Llamar a proveedores de IA (OpenAI, Gemini)
 * - Seleccionar modelo según function_type
 * - Devolver respuesta bruta
 *
 * Implementaciones esperadas:
 * - infrastructure/ai/openai/OpenAIAdapter.js
 * - infrastructure/ai/gemini/GeminiAdapter.js
 */

/**
 * Contrato de proveedor de IA
 *
 * REGLA FUNDAMENTAL:
 * - El FRONTEND construye los prompts
 * - El FRONTEND decide los flujos (1, 2 o 3 pasadas)
 * - El BACKEND solo ejecuta llamadas individuales
 */
export class IAIProvider {
  /**
   * Llamada universal a IA
   *
   * @param {string} userId - ID del usuario
   * @param {Array<Object>} messages - Array de mensajes [{role, content}] (construidos por el frontend)
   * @param {Object} options - Opciones de configuración {model, temperature, maxTokens, forceJson}
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAI(userId, messages, options) {
    throw new Error('Not implemented');
  }

  /**
   * Llamada a IA con mapeo automático de modelo según tipo de función
   *
   * RESPONSABILIDAD:
   * - Seleccionar modelo vía ModelSelectionPolicy
   * - Llamar a callAI con el modelo seleccionado
   *
   * @param {string} userId - ID del usuario
   * @param {Array<Object>} messages - Array de mensajes [{role, content}] (construidos por el frontend)
   * @param {string} functionType - Tipo de función (home_phrase, chat, step_commentary, etc.)
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAIWithFunctionType(userId, messages, functionType) {
    throw new Error('Not implemented');
  }
}

export default IAIProvider;
