/**
 * AI Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/ai.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * FECHA REFACTORIZACIÓN: 2025-12-30
 * ARQUITECTURA: Hexagonal (Ports & Adapters)
 *
 * ENDPOINTS:
 * ✅ POST /api/ai/chat - Llamada unificada a IA con function_type
 *
 * ELIMINADO (lógica de producto movida al frontend):
 * ❌ POST /api/ai/json-convert - El frontend construye el prompt de conversión JSON y usa /chat
 * ❌ POST /api/ai/execution-summary - El frontend construye el prompt y orquesta el flujo
 * ❌ POST /api/ai/habit-series - El frontend construye el prompt y orquesta el flujo
 *
 * El modelo de IA se determina automáticamente según function_type
 * (ver domain/policies/ModelSelectionPolicy.js)
 */

import express from 'express';
import { chatEndpoint } from '../controllers/AIController.js';
import { authenticate } from '../middleware/authenticate.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { authorizeFeature } from '../middleware/authorizeFeature.js';
import { validateInputSize } from '../middleware/validateInputSize.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/ai/chat
 * Endpoint unificado para todas las llamadas a IA
 *
 * Body:
 * {
 *   messages: [{role, content}],
 *   function_type: 'home_phrase' | 'chat' | 'step_commentary' | etc.
 * }
 *
 * El modelo, temperature y maxTokens se determinan automáticamente
 * según function_type (ver modelMapping.js)
 *
 * NOTA: La validación de energía se hace DENTRO del servicio (server-side)
 *       para evitar consumir energía innecesariamente
 *
 * ORDEN DE MIDDLEWARES:
 * 1. authenticate - Verifica token Firebase
 * 2. aiRateLimiter - Previene abuso
 * 3. authorizeFeature - Verifica plan permite la feature
 * 4. validateInputSize - Valida tamaño del payload
 * 5. chatEndpoint - Controller
 */
router.post(
  '/chat',
  aiRateLimiter,
  authorizeFeature('ai.chat'),
  validateInputSize({
    maxBodySize: 50 * 1024, // 50 KB
    fields: {
      messages: { type: 'array', maxLength: 20, required: true },
      'messages[].content': { type: 'string', maxLength: 2000 },
    },
  }),
  chatEndpoint
);

export default router;
