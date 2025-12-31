/**
 * AI Controller (Infrastructure - HTTP Layer)
 *
 * MIGRADO DESDE: src/controllers/aiController.js
 * REFACTORIZADO: 2025-12-30
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 *
 * RESPONSABILIDAD ÚNICA:
 * - Adaptar HTTP (req/res) → Use Cases
 * - Validar input HTTP
 * - Traducir errores a status codes
 * - NO contiene lógica de negocio
 *
 * LÓGICA MOVIDA A:
 * - domain/use-cases/GenerateAIResponse.js:generateAIResponseWithFunctionType (línea 54 del original)
 *
 * ELIMINADO (lógica de producto movida al frontend):
 * - executionSummaryEndpoint → El frontend construye el prompt y orquesta el flujo
 * - habitSeriesEndpoint → El frontend construye el prompt y orquesta el flujo
 * - jsonConvertEndpoint → El frontend construye el prompt de conversión JSON y usa /chat
 */

import { generateAIResponseWithFunctionType } from '../../../domain/use-cases/GenerateAIResponse.js';
import { validateMessages } from '../../../domain/validators/InputValidator.js';
import { ValidationError } from '../../../shared/errorTypes.js';
import { success, error as logError } from '../../../shared/logger.js';
import { isValidFunctionType } from '../../../domain/policies/ModelSelectionPolicy.js';

// Dependency injection - estas serán inyectadas en runtime
let aiProvider;
let energyRepository;
let userRepository;

export function setDependencies(deps) {
  aiProvider = deps.aiProvider;
  energyRepository = deps.energyRepository;
  userRepository = deps.userRepository;
}

/**
 * POST /api/ai/chat
 * Endpoint unificado para todas las llamadas a IA
 *
 * COMPORTAMIENTO ORIGINAL: src/controllers/aiController.js:36-69
 */
export async function chatEndpoint(req, res, next) {
  try {
    const userId = req.user?.uid;
    const { messages, function_type } = req.body;

    // EXTRACCIÓN EXACTA: src/controllers/aiController.js:42-52
    // Validaciones HTTP
    if (!messages || !validateMessages(messages)) {
      throw new ValidationError('Mensajes inválidos o vacíos');
    }

    if (!function_type || typeof function_type !== 'string') {
      throw new ValidationError('function_type es requerido y debe ser string');
    }

    if (!isValidFunctionType(function_type)) {
      throw new ValidationError(`function_type "${function_type}" no es válido. Consulta modelMapping.js`);
    }

    // DELEGACIÓN A USE CASE (reemplaza línea 54 del original)
    const response = await generateAIResponseWithFunctionType(
      userId,
      messages,
      function_type,
      { aiProvider, energyRepository }
    );

    // EXTRACCIÓN EXACTA: src/controllers/aiController.js:56
    success(`[AI Chat] Completado para ${userId} - Tipo: ${function_type}, Modelo: ${response.model}, Energía: ${response.energyConsumed}`);

    // EXTRACCIÓN EXACTA: src/controllers/aiController.js:58-64
    res.json({
      success: true,
      message: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
      energyConsumed: response.energyConsumed,
    });
  } catch (err) {
    // EXTRACCIÓN EXACTA: src/controllers/aiController.js:66-67
    logError('[AI Chat] Error:', err);
    next(err);
  }
}

export default {
  chatEndpoint,
  setDependencies,
};
