/**
 * Layer: Infrastructure
 * File: authorizeFeature.js
 * Responsibility:
 * Reads the user's plan from Firestore and enforces feature access control before delegating to the next handler.
 */

import { hasFeatureAccess } from '../../../01domain/policies/PlanPolicy.js';
import { logger } from '../../logger/Logger.js';

// Dependency injection
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

/**
 * Middleware factory that authorizes feature access by plan.
 *
 * @param {string} featureKey - Feature key (e.g., 'ai.chat', 'ai.json_convert')
 * @returns {Function} Express middleware
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
        logger.error(`[AuthorizeFeature] Usuario no encontrado: ${userId}`);
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado en la base de datos',
        });
      }

      let effectivePlan = user.plan || 'freemium';

      if (effectivePlan === 'freemium' && user.trial?.activo) {
        effectivePlan = 'trial';
      }

      const hasAccess = hasFeatureAccess(effectivePlan, featureKey);

      if (!hasAccess) {
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

      req.userPlan = {
        planId: effectivePlan,
        isTrialActive: effectivePlan === 'trial',
        subscriptionStatus: user.subscriptionStatus,
      };

      next();
    } catch (error) {
      logger.error('[AuthorizeFeature] Error:', error);
      return res.status(500).json({
        error: 'AUTHORIZATION_ERROR',
        message: 'Error al verificar permisos',
      });
    }
  };
}

export default { authorizeFeature, setDependencies };
