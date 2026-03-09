/**
 * Arvi Backend Server - Composition Root
 *
 * This file serves as the entry point for the Arvi backend application.
 */

import cors from 'cors';
import 'dotenv/config';
import express from 'express';

// Import routes (Hexagonal Architecture)
import authRoutes from './03infrastructure/http/routes/Auth.routes.js';
import billingRoutes from './03infrastructure/http/routes/Billing.routes.js';
import habitSeriesRoutes from './03infrastructure/http/routes/HabitSeriesRoutes.js';
import userRoutes from './03infrastructure/http/routes/User.routes.js';
import webhookRoutes from './03infrastructure/http/routes/Webhook.routes.js';

// Import middleware (Hexagonal Architecture)
import { errorMiddleware } from './03infrastructure/http/middlewares/errorMiddleware.js';

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP - DEPENDENCY COMPOSITION
// ═══════════════════════════════════════════════════════════════
// This is the ONLY place where adapter instances are created
// and injected into controllers via setDependencies.
//
// HEXAGONAL ARCHITECTURE - DEPENDENCY INJECTION:
// 1. Create UNIQUE instances of infrastructure adapters
// 2. Inject into ALL controllers that require them
// 3. Do NOT allow controllers or use cases to create their own instances
// 4. Facilitate testing (allows injecting mocks instead of real instances)
//
// IMPORTANT: This pattern properly closes the hexagonal architecture
// without modifying existing business logic.
// ═══════════════════════════════════════════════════════════════

// Import Firebase configuration (Hexagonal Architecture)
import { initializeFirebase } from './03infrastructure/persistence/firestore/FirebaseConfig.js';

// Import Infrastructure Adapters (Repositories)
import FirestoreHabitSeriesRepository from './03infrastructure/persistence/firestore/FirestoreHabitSeriesRepository.js';
import FirestoreUserRepository from './03infrastructure/persistence/firestore/FirestoreUserRepository.js';

// Importar AI Provider Router (routes to correct adapter based on model)
import AIProviderRouter from './03infrastructure/ai/AIProviderRouter.js';

// Import Password Hasher
import PasswordHasher from './03infrastructure/security/PasswordHasher.js';

// Import Controllers for dependency injection
import { setDependencies as setAuthDeps } from './03infrastructure/http/controllers/AuthController.js';
import { setDependencies as setBillingDeps } from './03infrastructure/http/controllers/BillingController.js';
import { setDependencies as setHabitSeriesDeps } from './03infrastructure/http/controllers/HabitSeriesController.js';
import { setDependencies as setUserDeps } from './03infrastructure/http/controllers/UserController.js';
import { setDependencies as setResolvePlanDeps } from './03infrastructure/http/middlewares/resolvePlan.js';

// Import Stripe service
import * as stripeService from './03infrastructure/billing/stripe/StripeService.js';

// Initialize Firebase Admin SDK
initializeFirebase();

// ───────────────────────────────────────────────────────────────
// CREATE UNIQUE ADAPTER INSTANCES
// ───────────────────────────────────────────────────────────────

const userRepository = new FirestoreUserRepository();
const habitSeriesRepository = new FirestoreHabitSeriesRepository();
const aiProvider = new AIProviderRouter(); // Routes to Gemini/OpenAI based on model
const passwordHasher = new PasswordHasher();

// ───────────────────────────────────────────────────────────────
// INJECT DEPENDENCIES INTO CONTROLLERS
// ───────────────────────────────────────────────────────────────
// Call setDependencies on EACH controller that requires it.

// AuthController requires: userRepository, passwordHasher
setAuthDeps({
  userRepository,
  passwordHasher,
});

// UserController requires: userRepository
setUserDeps({
  userRepository
});

// HabitSeriesController requires: userRepository, habitSeriesRepository, aiProvider
setHabitSeriesDeps({
  userRepository,
  habitSeriesRepository,
  aiProvider
});

// BillingController requires: userRepository, stripeService
setBillingDeps({
  userRepository,
  stripeService,
});

// resolvePlan middleware requires: userRepository
setResolvePlanDeps({
  userRepository,
});

const app = express();

// ═══════════════════════════════════════════════════════════════
// GENERAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

app.set('trust proxy', 1);
app.use(cors());

// Webhook routes must be mounted BEFORE express.json() so that
// express.raw() receives the unmodified body for Stripe signature verification.
app.use('/api/webhooks', webhookRoutes);

// JSON parser for all other routes
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

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
    message: '🚀 ARVI Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      user: 'GET /api/user/profile, PATCH /api/user/profile, GET /api/user/dashboard',
      habits: 'POST /api/habits/series, GET /api/habits/series, GET /api/habits/series/:seriesId, DELETE /api/habits/series/:seriesId, POST /api/habits/series/:seriesId/actions',
      billing: 'POST /api/billing/create-checkout-session',
      billingRedirects: 'GET /billing/success, GET /billing/cancel',
      webhooks: 'POST /api/webhooks/stripe',
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// BILLING REDIRECT ENDPOINTS (deep link bridge)
// Stripe Checkout redirects here; we forward to the mobile deep link.
// ═══════════════════════════════════════════════════════════════

app.get('/billing/success', (req, res) => {
  console.log('Received billing success redirect from Stripe. Redirecting to arvi://billing/success');
  res.redirect('arvi://billing/success');
});

app.get('/billing/cancel', (req, res) => {
  console.log('Received billing cancel redirect from Stripe. Redirecting to arvi://billing/cancel');
  res.redirect('arvi://billing/cancel');
});

// ═══════════════════════════════════════════════════════════════
// API ROUTES (NEW ARCHITECTURE)
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);          // ✅ Authentication
app.use('/api/user', userRoutes);          // ✅ User management
app.use('/api/habits', habitSeriesRoutes); // ✅ Habit series
app.use('/api/billing', billingRoutes);    // ✅ Billing (Stripe checkout)

// ═══════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// Route not found
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/habits/series',
      'GET /api/habits/series',
      'GET /api/habits/series/:seriesId',
      'DELETE /api/habits/series/:seriesId',
      'POST /api/habits/series/:seriesId/actions',
      'GET /api/user/dashboard',
      'POST /api/billing/create-checkout-session',
      'GET /billing/success',
      'GET /billing/cancel',
      'POST /api/webhooks/stripe',
    ],
  });
});

// Global error middleware (must be registered AFTER all routes)
app.use(errorMiddleware);

// ═══════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 ARVI Backend Server v1.0.0');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Port:            ${PORT}`);
  console.log(`  🌍 Environment:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 URL:             http://localhost:${PORT}`);
  console.log('');
  console.log('  ✅ Active routes:');
  console.log('     • GET  /health                       - Health check');
  console.log('     • GET  /                             - API info');
  console.log('     • POST /api/auth/login              - User login');
  console.log('     • POST /api/auth/register           - User registration');
  console.log('     • POST   /api/habits/series            - Create habit series via AI');
  console.log('     • GET    /api/user/dashboard              - User dashboard (profile + limits)');
  console.log('     • GET    /api/habits/series              - Get all habit series for user');
  console.log('     • GET    /api/habits/series/:seriesId  - Get habit series by ID');
  console.log('     • DELETE /api/habits/series/:id        - Delete habit series');
  console.log('     • POST   /api/habits/series/:id/actions - Add AI-generated action to series');
  console.log('     • POST   /api/billing/create-checkout-session - Create Stripe Checkout Session');
  console.log('     • GET    /billing/success                  - Redirect to arvi://billing/success');
  console.log('     • GET    /billing/cancel                   - Redirect to arvi://billing/cancel');
  console.log('     • POST   /api/webhooks/stripe              - Stripe webhook handler');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

