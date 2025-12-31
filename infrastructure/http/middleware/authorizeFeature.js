/**
 * Authorization Middleware (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/middleware/authorizeFeature.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Middleware para autorizar acceso a features según el plan del usuario
 *
 * USO:
 * router.post('/chat', authenticate, authorizeFeature('ai.chat'), controller);
 *
 * IMPORTANTE:
 * - SIEMPRE debe ir DESPUÉS de authenticate middleware
 * - Lee el plan real desde Firestore (no confía en datos del frontend)
 * - Respeta trial activo
 * - Bloquea con 403 si el plan no permite la feature
 */

import { hasFeatureAccess } from '../../../domain/policies/PlanPolicy.js';
import { error as logError } from '../../../shared/logger.js';

// Dependency injection - será inyectada en runtime
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * Middleware factory para autorizar features por plan
 * MIGRADO DESDE: src/middleware/authorizeFeature.js:authorizeFeature (líneas 26-93)
 *
 * @param {string} featureKey - Clave de la feature (ej: 'ai.chat', 'ai.json_convert')
 * @returns {Function} Middleware de Express
 */
export function authorizeFeature(featureKey) {
  return async (req, res, next) => {
    try {
      // 1. Obtener userId desde authenticate middleware
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
        });
      }

      // 2. Obtener usuario completo desde Firestore (fuente de verdad)
      const user = await userRepository.getUser(userId);

      if (!user) {
        logError(`[AuthorizeFeature] Usuario no encontrado: ${userId}`);
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado en la base de datos',
        });
      }

      // 3. Determinar plan efectivo
      let effectivePlan = user.plan || 'freemium';

      // Si es freemium pero tiene trial activo, usar trial
      if (effectivePlan === 'freemium' && user.trial?.activo) {
        effectivePlan = 'trial';
      }

      // 4. Verificar si el plan permite acceso a la feature
      const hasAccess = hasFeatureAccess(effectivePlan, featureKey);

      if (!hasAccess) {
        // Logging estructurado de denegación
        console.log('🚫 [Authorization] Feature bloqueada');
        console.log(`   → User ID: ${userId}`);
        console.log(`   → Feature: ${featureKey}`);
        console.log(`   → Plan: ${effectivePlan}`);
        console.log(`   → Endpoint: ${req.method} ${req.path}`);

        return res.status(403).json({
          error: 'FEATURE_NOT_ALLOWED',
          feature: featureKey,
          plan: effectivePlan,
          message: `El plan ${effectivePlan} no tiene acceso a esta funcionalidad`,
        });
      }

      // 5. Acceso permitido - agregar info al request para uso posterior
      req.userPlan = {
        planId: effectivePlan,
        isTrialActive: effectivePlan === 'trial',
        subscriptionStatus: user.subscriptionStatus,
      };

      next();
    } catch (error) {
      logError('[AuthorizeFeature] Error:', error);
      return res.status(500).json({
        error: 'AUTHORIZATION_ERROR',
        message: 'Error al verificar permisos',
      });
    }
  };
}

export default { authorizeFeature, setDependencies };
