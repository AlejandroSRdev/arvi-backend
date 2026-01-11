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
 * - application/use-cases/GenerateAIResponse.js:generateAIResponseWithFunctionType
 */

import { generateAIResponseWithFunctionType } from '../../../application/use-cases/GenerateAIResponse.js';
import { validateMessages } from '../../../domain/validators/InputValidator.js';
import { isValidFunctionType } from '../../../domain/policies/ModelSelectionPolicy.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../errorMapper.js';
import { error as logError, success } from '../../logger/logger.js';

// Dependency injection
let aiProvider;
let energyRepository;
let habitSeriesRepository;

export function setDependencies(deps) {
  aiProvider = deps.aiProvider;
  energyRepository = deps.energyRepository;
  habitSeriesRepository = deps.habitSeriesRepository;
}

/**
 * POST /api/ai/chat
 * Endpoint unificado para todas las llamadas a IA
 */
export async function chatEndpoint(req, res) {
  try {
    const userId = req.user?.uid;
    const { messages, function_type } = req.body;

    // Validaciones HTTP
    if (!messages || !validateMessages(messages)) {
      const err = new Error('Mensajes inválidos o vacíos');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!function_type || typeof function_type !== 'string') {
      const err = new Error('function_type es requerido y debe ser string');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!isValidFunctionType(function_type)) {
      const err = new Error(`function_type "${function_type}" no es válido. Consulta modelMapping.js`);
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const response = await generateAIResponseWithFunctionType(
      userId,
      messages,
      function_type,
      { aiProvider, energyRepository, habitSeriesRepository }
    );

    success(`[AI Chat] Completado para ${userId} - Tipo: ${function_type}, Modelo: ${response.model}, Energía: ${response.energyConsumed}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
      energyConsumed: response.energyConsumed,
    });
  } catch (err) {
    logError('[AI Chat] Error:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  chatEndpoint,
  setDependencies,
};
