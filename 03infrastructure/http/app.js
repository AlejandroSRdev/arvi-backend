/**
 * Layer: Infrastructure
 * File: app.js
 * Responsibility:
 * Builds the Express application with injected dependencies. Does NOT call listen()
 * and does NOT initialize infrastructure adapters — those concerns live in the
 * composition root (server.js) so that tests can build an app with fake adapters.
 */

import cors from 'cors';
import express from 'express';

import authRoutes from './routes/Auth.routes.js';
import billingRoutes from './routes/Billing.routes.js';
import habitSeriesRoutes from './routes/HabitSeriesRoutes.js';
import userRoutes from './routes/User.routes.js';
import webhookRoutes from './routes/Webhook.routes.js';

import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { requestLogger } from './middlewares/requestLogger.js';

import { setDependencies as setAuthDeps } from './controllers/AuthController.js';
import { setDependencies as setBillingDeps } from './controllers/BillingController.js';
import { setDependencies as setHabitSeriesDeps } from './controllers/HabitSeriesController.js';
import { setDependencies as setUserDeps } from './controllers/UserController.js';
import { setDependencies as setResolvePlanDeps } from './middlewares/resolvePlan.js';

import { buildTestSupportRouter } from './test-support/testSupportRouter.js';

/**
 * Build an Express application with the given dependencies injected into controllers.
 *
 * @param {Object} deps
 * @param {Object} deps.userRepository
 * @param {Object} deps.habitSeriesRepository
 * @param {Object} deps.aiProvider
 * @param {Object} deps.passwordHasher
 * @param {Object} deps.stripeService
 * @returns {import('express').Express}
 */
export function buildApp({
  userRepository,
  habitSeriesRepository,
  aiProvider,
  passwordHasher,
  stripeService,
}) {
  setAuthDeps({ userRepository, passwordHasher });
  setUserDeps({ userRepository });
  setHabitSeriesDeps({ userRepository, habitSeriesRepository, aiProvider });
  setBillingDeps({ userRepository, stripeService });
  setResolvePlanDeps({ userRepository });

  const app = express();

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(requestLogger);

  // Webhook routes must be mounted BEFORE express.json() so that
  // express.raw() receives the unmodified body for Stripe signature verification.
  app.use('/api/webhooks', webhookRoutes);

  app.use(express.json());

  // Test-support endpoints — mounted ONLY when ARVI_TEST_MODE=true.
  // Never reachable in production boots because the flag is never set there.
  if (process.env.ARVI_TEST_MODE === 'true') {
    app.use(
      '/__test__',
      buildTestSupportRouter({
        userRepository,
        habitSeriesRepository,
        aiProvider,
        passwordHasher,
      })
    );
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Arvi Backend',
      version: '1.0.0',
    });
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'ARVI Backend API',
      version: '1.0.0',
    });
  });

  app.get('/billing/success', (req, res) => {
    res.redirect('arvi://billing/success');
  });

  app.get('/billing/cancel', (req, res) => {
    res.redirect('arvi://billing/cancel');
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/habits', habitSeriesRoutes);
  app.use('/api/billing', billingRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: true,
      message: `Route not found: ${req.method} ${req.path}`,
    });
  });

  app.use(errorMiddleware);

  return app;
}

export default buildApp;
