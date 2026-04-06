/**
 * Layer: Infrastructure
 * File: testSupportRouter.js
 * Responsibility:
 * Exposes HTTP endpoints used by acceptance tests to seed and reset state.
 * MOUNTED ONLY WHEN process.env.ARVI_TEST_MODE === 'true'. Never registered in production.
 *
 * Endpoints:
 *   POST /__test__/reset                  — wipes all in-memory state
 *   POST /__test__/seed/user              — { email, password } → { userId }
 */

import express from 'express';

export function buildTestSupportRouter({
  userRepository,
  habitSeriesRepository,
  aiProvider,
  passwordHasher,
}) {
  const router = express.Router();

  router.post('/reset', (req, res) => {
    userRepository._reset?.();
    habitSeriesRepository._reset?.();
    aiProvider._reset?.();
    res.status(204).end();
  });

  router.post('/seed/user', async (req, res, next) => {
    try {
      const { email, password, ...rest } = req.body ?? {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: true, message: 'email and password are required' });
      }

      const hashed = await passwordHasher.hash(password);
      const stored = userRepository._seed({
        email,
        password: hashed,
        plan: 'freemium',
        limits: {
          maxActiveSeries: 0,
          monthlyActionsMax: 0,
          monthlyActionsRemaining: 0,
        },
        ...rest,
      });

      return res.status(201).json({ userId: stored.id });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

export default buildTestSupportRouter;
