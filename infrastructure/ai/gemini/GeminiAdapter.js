/**
 * Gemini Adapter (Infrastructure Layer)
 *
 * MIGRADO DESDE: src/services/aiService.js (líneas 29-66, 134-173)
 * REFACTORIZADO: 2025-12-30
 * ALINEADO CON: frontend-reference/services/ai_service_refactor2.dart
 *
 * IMPLEMENTA: domain/ports/IAIProvider.js
 *
 * RESPONSABILIDADES:
 * - Implementar contrato IAIProvider usando Google Generative AI SDK
 * - Traducir input del dominio → llamada Gemini API
 * - Traducir respuesta Gemini → formato esperado por dominio
 * - Calcular tokensUsed (aproximación: text.length / 3.7)
 * - Calcular energyConsumed según fórmula original:
 *   ceil((responseTokens + promptTokens × 0.30) / 100)
 *
 * NO CONTIENE:
 * - Lógica de prompts (eso está en el frontend)
 * - Flujos multi-pasada (eso está en el frontend)
 * - Decisiones de "qué generar" (eso está en el frontend)
 *
 * COMPORTAMIENTO ORIGINAL PRESERVADO:
 * - Cálculo de tokens Gemini: text.length / 3.7
 * - Cálculo de energía: ceil((response + prompt×0.30) / 100)
 * - Conversión de mensajes a formato Gemini
 * - forceJson → responseMimeType: 'application/json'
 * - temperature, maxOutputTokens según opciones
 */

import { getModel } from './GeminiConfig.js';
import { IAIProvider } from '../../../domain/ports/IAIProvider.js';
import { sanitizeUserInput } from '../../../application/input/SanitizeUserInput.js';

/**
 * Calcular tokens para Gemini (aproximación)
 *
 * EXTRACCIÓN: src/services/aiService.js:38-41 (calculateGeminiTokens)
 *
 * Fórmula original: text.length / 3.7
 *
 * @param {string} text - Texto a calcular
 * @returns {number} - Número estimado de tokens
 */
function calculateGeminiTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.round(text.length / 3.7);
}

/**
 * Calcular energía a consumir para Gemini
 *
 * EXTRACCIÓN: src/services/aiService.js:57-66 (calculateGeminiEnergy)
 *
 * Fórmula original:
 * 1. tokens_prompt = calculateGeminiTokens(prompt)
 * 2. tokens_respuesta = calculateGeminiTokens(respuesta)
 * 3. total = respuesta + (prompt × 0.30)
 * 4. energia = ceil(total / 100)
 *
 * @param {string} prompt - Prompt enviado
 * @param {string} response - Respuesta recibida
 * @returns {number} - Energía a consumir
 */
function calculateGeminiEnergy(prompt, response) {
  const tokensPrompt = calculateGeminiTokens(prompt);
  const tokensRespuesta = calculateGeminiTokens(response);
  const totalTokens = Math.round(tokensRespuesta + (tokensPrompt * 0.30));
  const energia = Math.ceil(totalTokens / 100);

  console.log(`📊 [Gemini Energy] Prompt: ${tokensPrompt}t, Respuesta: ${tokensRespuesta}t, Total: ${totalTokens}t → Energía: ${energia}`);

  return energia;
}

/**
 * Adapter de Gemini que implementa el port IAIProvider
 */
export class GeminiAdapter extends IAIProvider {
  /**
   * Llamada universal a Gemini
   *
   * EXTRACCIÓN: src/services/aiService.js:134-173
   *
   * @param {string} userId - ID del usuario (no usado por Gemini SDK, solo para logs)
   * @param {Array<Object>} messages - Array de mensajes [{role: 'user'|'system'|'assistant', content: string}] (construidos por el frontend)
   * @param {Object} options - Opciones de configuración
   * @param {string} options.model - Modelo específico (default: 'gemini-2.5-flash')
   * @param {number} options.temperature - Temperatura 0.0-1.0 (default: 0.7)
   * @param {number} options.maxTokens - Límite de tokens (default: 1500)
   * @param {boolean} options.forceJson - Forzar respuesta JSON (default: false)
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAI(userId, messages, options = {}) {
    try {
      const {
        model = 'gemini-2.5-flash',
        temperature = 0.7,
        maxTokens = 1500,
        forceJson = false,
      } = options;

      // EXTRACCIÓN EXACTA: src/services/aiService.js:136
      console.log(`🧠 [Gemini] Llamando modelo: ${model}`);

      // EXTRACCIÓN EXACTA: src/services/aiService.js:138
      const geminiModel = getModel(model);

      // Sanitize user input at the system boundary (before any processing)
      // Only user messages contain raw input; system/assistant messages are internal
      const sanitizedMessages = messages.map(m => {
        if (m.role === 'user') {
          return { ...m, content: sanitizeUserInput(m.content) };
        }
        return m;
      });

      // EXTRACCIÓN EXACTA: src/services/aiService.js:140-145
      // Convertir mensajes a formato Gemini
      const prompt = sanitizedMessages.map(m => {
        if (m.role === 'system') return `[SYSTEM INSTRUCTIONS]\n${m.content}`;
        if (m.role === 'assistant') return `[ASSISTANT]\n${m.content}`;
        return m.content;
      }).join('\n\n');

      // EXTRACCIÓN EXACTA: src/services/aiService.js:147-151
      const generationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
        ...(forceJson && { responseMimeType: 'application/json' }),
      };

      // EXTRACCIÓN EXACTA: src/services/aiService.js:153-156
      const result = await geminiModel.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      });

      // EXTRACCIÓN EXACTA: src/services/aiService.js:158-159
      const content = result.response.text();
      const tokensUsed = calculateGeminiTokens(content);

      // EXTRACCIÓN EXACTA: src/services/aiService.js:161-163
      // ✅ SOLO GEMINI CONSUME ENERGÍA (contenido creativo)
      // Fórmula original de Flutter: ceil((responseTokens + promptTokens × 0.30) / 100)
      const energyToConsume = calculateGeminiEnergy(prompt, content);

      // EXTRACCIÓN EXACTA: src/services/aiService.js:165-170
      const response = {
        content,
        model,
        tokensUsed,
        energyConsumed: energyToConsume,
      };

      // EXTRACCIÓN EXACTA: src/services/aiService.js:172
      console.log(`✅ [Gemini] Respuesta recibida - Tokens: ${tokensUsed}, Energía: ${energyToConsume}`);

      return response;

    } catch (error) {
      console.error(`❌ [GeminiAdapter] Error en callAI: ${error.message}`);
      throw new Error(`Error al llamar a Gemini: ${error.message}`);
    }
  }

  /**
   * Llamada a IA con mapeo automático de modelo según tipo de función
   *
   * NOTA: Este método delega la selección de modelo al use-case.
   * En la práctica, el use-case usa ModelSelectionPolicy para
   * determinar el modelo correcto antes de llamar a callAI.
   *
   * @param {string} userId - ID del usuario
   * @param {Array<Object>} messages - Array de mensajes [{role, content}] (construidos por el frontend)
   * @param {string} functionType - Tipo de función (usado por ModelSelectionPolicy)
   * @returns {Promise<Object>} {content, model, tokensUsed, energyConsumed}
   */
  async callAIWithFunctionType(userId, messages, functionType) {
    // Gemini usa gemini-2.5-flash por defecto para todas las funciones
    // El use case determina el modelo apropiado vía ModelSelectionPolicy antes de llamar
    return await this.callAI(userId, messages, {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1500,
      forceJson: false,
    });
  }
}

export default GeminiAdapter;
