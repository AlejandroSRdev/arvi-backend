/**
 * Layer: Infrastructure
 * File: resolvePlan.js
 * Responsibility:
 * Fetches the full user record from Firestore and resolves the effective plan ID.
 * Attaches the result to req.plan. Must run after authenticate middleware.
 *
 * req.plan === null means the user has no active plan (expired trial or no subscription).
 */

import { resolveUserPlan } from '../../../01domain/policies/PlanPolicy.js';

// Dependency injection — wired in server.js composition root
let userRepository;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
}

export async function resolvePlan(req, res, next) {
  try {
    const userId = req.user?.id;

    const user = await userRepository.getUser(userId);

    if (!user) {
      req.plan = null;
      return next();
    }

    req.plan = resolveUserPlan(user);

    next();
  } catch (err) {
    return next(err);
  }
}

export default { resolvePlan, setDependencies };
