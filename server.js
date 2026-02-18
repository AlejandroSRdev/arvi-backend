/**
 * Arvi Backend Server - Composition Root
 *
 * This file serves as the entry point for the Arvi backend application.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routes (Hexagonal Architecture)
import authRoutes from './03infrastructure/http/routes/Auth.routes.js';
import energyRoutes from './03infrastructure/http/routes/Energy.routes.js';
import userRoutes from './03infrastructure/http/routes/User.routes.js';
import habitSeriesRoutes from './03infrastructure/http/routes/HabitSeriesRoutes.js';

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
import FirestoreUserRepository from './03infrastructure/persistence/firestore/FirestoreUserRepository.js';
import FirestoreEnergyRepository from './03infrastructure/persistence/firestore/FirestoreEnergyRepository.js';
import FirestoreHabitSeriesRepository from './03infrastructure/persistence/firestore/FirestoreHabitSeriesRepository.js';

// Importar AI Provider Router (routes to correct adapter based on model)
import AIProviderRouter from './03infrastructure/ai/AIProviderRouter.js';

// Import Password Hasher
import PasswordHasher from './03infrastructure/security/PasswordHasher.js';

// Import Controllers for dependency injection
import { setDependencies as setAuthDeps } from './03infrastructure/http/controllers/AuthController.js';
import { setDependencies as setUserDeps } from './03infrastructure/http/controllers/UserController.js';
import { setDependencies as setEnergyDeps } from './03infrastructure/http/controllers/EnergyController.js';
import { setDependencies as setHabitSeriesDeps } from './03infrastructure/http/controllers/HabitSeriesController.js';

// Initialize Firebase Admin SDK
initializeFirebase();

// ───────────────────────────────────────────────────────────────
// CREATE UNIQUE ADAPTER INSTANCES
// ───────────────────────────────────────────────────────────────

const userRepository = new FirestoreUserRepository();
const energyRepository = new FirestoreEnergyRepository();
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

// EnergyController requires: energyRepository, userRepository
setEnergyDeps({
  energyRepository,
  userRepository
});


// HabitSeriesController requires: userRepository, habitSeriesRepository, energyRepository, aiProvider
setHabitSeriesDeps({
  userRepository,
  habitSeriesRepository,
  energyRepository,
  aiProvider
});

const app = express();

// ═══════════════════════════════════════════════════════════════
// GENERAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

app.set('trust proxy', 1);
app.use(cors());

// JSON parser for all routes
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Arvi Backend',
    version: '2.0.1',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 ARVI Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      energy: 'GET /api/energy, POST /api/energy/consume',
      user: 'GET /api/user/profile, PATCH /api/user/profile',
      habits: 'POST /api/habits/series',
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// API ROUTES (NEW ARCHITECTURE)
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);       // ✅ Authentication
app.use('/api/energy', energyRoutes);   // ✅ Energy management
app.use('/api/user', userRoutes);       // ✅ User management
app.use('/api/habits', habitSeriesRoutes); // ✅ Habit series

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
      'GET /api/energy',
      'POST /api/habits/series',
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
  console.log('     • GET  /api/energy                   - Query energy');
  console.log('     • POST /api/habits/series            - Create habit series via AI');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

