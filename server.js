/**
 * Arvi Backend Server - Composition Root
 *
 * ARQUITECTURA HEXAGONAL - REFACTORIZADO: 2025-12-30
 *
 * Responsabilidades (Composition Root):
 * - Configurar Express y middlewares globales
 * - Inicializar adaptadores de infraestructura (Firebase, Stripe)
 * - Conectar rutas HTTP a controladores
 * - Manejo de errores global
 * - NO contiene lógica de negocio
 * - NO accede directamente a servicios externos
 *
 * Backend unificado que incluye:
 * - Stripe (checkout, webhooks)
 * - AI Service (chat, JSON conversion)
 * - Energy Management
 * - User Management
 * - Authentication
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Importar rutas (Hexagonal Architecture)
import authRoutes from './03infrastructure/http/routes/auth.routes.js';
import energyRoutes from './03infrastructure/http/routes/energy.routes.js';
import userRoutes from './03infrastructure/http/routes/user.routes.js';
import stripeRoutes from './03infrastructure/http/routes/stripe.routes.js';
import webhookRoutes from './03infrastructure/http/routes/webhook.routes.js';
import paymentRoutes from './03infrastructure/http/routes/payment.routes.js';
import habitSeriesRoutes from './03infrastructure/http/routes/HabitSeriesRoutes.js';
import executionSummaryRoutes from './03infrastructure/http/routes/executionSummary.routes.js';

// Importar middleware (Hexagonal Architecture)
import { errorHandler } from './03infrastructure/http/middleware/errorHandler.js';

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP - COMPOSICIÓN DE DEPENDENCIAS
// ═══════════════════════════════════════════════════════════════
// Este es el ÚNICO lugar donde se crean instancias de adaptadores
// y se inyectan en los controllers mediante setDependencies.
//
// ARQUITECTURA HEXAGONAL - INYECCIÓN DE DEPENDENCIAS:
// 1. Crear instancias ÚNICAS de adaptadores de infraestructura
// 2. Inyectar en TODOS los controllers que las requieran
// 3. NO permitir que controllers o use cases creen instancias propias
// 4. Facilitar testing (permite inyectar mocks en lugar de instancias reales)
//
// IMPORTANTE: Este patrón cierra correctamente la arquitectura hexagonal
// sin modificar la lógica de negocio existente.
// ═══════════════════════════════════════════════════════════════

// Importar configuración Firebase (Hexagonal Architecture)
import { initializeFirebase } from './03infrastructure/persistence/firestore/FirebaseConfig.js';

// Importar Adaptadores de Infraestructura (Repositories)
import FirestoreUserRepository from './03infrastructure/persistence/firestore/FirestoreUserRepository.js';
import FirestoreEnergyRepository from './03infrastructure/persistence/firestore/FirestoreEnergyRepository.js';
import FirestoreHabitSeriesRepository from './03infrastructure/persistence/firestore/FirestoreHabitSeriesRepository.js';

// Importar AI Provider Router (routes to correct adapter based on model)
import AIProviderRouter from './03infrastructure/ai/AIProviderRouter.js';

// Importar Controllers para inyección de dependencias
import { setDependencies as setAuthDeps } from './03infrastructure/http/controllers/AuthController.js';
import { setDependencies as setUserDeps } from './03infrastructure/http/controllers/UserController.js';
import { setDependencies as setEnergyDeps } from './03infrastructure/http/controllers/EnergyController.js';
import { setDependencies as setWebhookDeps } from './03infrastructure/http/controllers/WebhookController.js';
import { setDependencies as setHabitSeriesDeps } from './03infrastructure/http/controllers/HabitSeriesController.js';
import { setDependencies as setExecutionSummaryDeps } from './03infrastructure/http/controllers/ExecutionSummaryController.js';

// Inicializar Firebase Admin SDK
initializeFirebase();

// ───────────────────────────────────────────────────────────────
// CREAR INSTANCIAS ÚNICAS DE ADAPTADORES
// ───────────────────────────────────────────────────────────────

const userRepository = new FirestoreUserRepository();
const energyRepository = new FirestoreEnergyRepository();
const habitSeriesRepository = new FirestoreHabitSeriesRepository();
const aiProvider = new AIProviderRouter(); // Routes to Gemini/OpenAI based on model

// ───────────────────────────────────────────────────────────────
// INYECTAR DEPENDENCIAS EN CONTROLLERS
// ───────────────────────────────────────────────────────────────
// Llamar a setDependencies en CADA controller que lo requiera.

// AuthController requiere: userRepository
setAuthDeps({
  userRepository
});

// UserController requiere: userRepository
setUserDeps({
  userRepository
});

// EnergyController requiere: energyRepository, userRepository
setEnergyDeps({
  energyRepository,
  userRepository
});

// WebhookController requiere: userRepository
setWebhookDeps({
  userRepository
});

// HabitSeriesController requiere: userRepository, habitSeriesRepository, energyRepository, aiProvider
setHabitSeriesDeps({
  userRepository,
  habitSeriesRepository,
  energyRepository,
  aiProvider
});

// ExecutionSummaryController requiere: userRepository
setExecutionSummaryDeps({
  userRepository
});

const app = express();

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN GENERAL
// ═══════════════════════════════════════════════════════════════

app.set('trust proxy', 1);
app.use(cors());

// JSON parser para el resto de rutas
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
    version: '2.0.1',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      energy: 'GET /api/energy, POST /api/energy/consume',
      user: 'GET /api/user/profile, PATCH /api/user/profile',
      habits: 'POST /api/habits/series',
      executionSummaries: 'POST /api/execution-summaries',
      payments: 'POST /api/payments/start',
      stripe: 'POST /api/stripe/create-checkout (legacy)',
      webhook: 'POST /api/webhooks/stripe',
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// RUTAS API (NUEVA ARQUITECTURA)
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);       // ✅ Autenticación
app.use('/api/energy', energyRoutes);   // ✅ Gestión de energía
app.use('/api/user', userRoutes);       // ✅ Gestión de usuarios
app.use('/api/stripe', stripeRoutes);   // ✅ Pagos y suscripciones (legacy)
app.use('/api/payments', paymentRoutes); // ✅ Inicio de pagos
app.use('/api/habits', habitSeriesRoutes); // ✅ Series de hábitos
app.use('/api/execution-summaries', executionSummaryRoutes); // ✅ Resúmenes de ejecución
app.use('/api/webhooks', webhookRoutes); // ✅ Webhooks de Stripe

// ═══════════════════════════════════════════════════════════════
// MANEJO DE ERRORES GLOBAL
// ═══════════════════════════════════════════════════════════════

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/ai/json-convert',
      'GET /api/energy',
      'POST /api/habits/series',
      'POST /api/execution-summaries',
      'POST /api/payments/start',
      'POST /api/stripe/create-checkout',
      'POST /api/webhooks/stripe',
    ],
  });
});

// Error handler global
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// INICIO DEL SERVIDOR
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 ARVI Backend Server v2.0.1');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Puerto:          ${PORT}`);
  console.log(`  🌍 Entorno:         ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 URL:             http://localhost:${PORT}`);
  console.log('');
  console.log('  ✅ Rutas activas:');
  console.log('     • GET  /health                       - Health check');
  console.log('     • GET  /                             - Info API');
  console.log('     • POST /api/ai/json-convert          - Conversión JSON');
  console.log('     • GET  /api/energy                   - Consultar energía');
  console.log('     • POST /api/habits/series            - Crear serie de hábitos via IA');
  console.log('     • POST /api/execution-summaries      - Validar generación resumen ejecución');
  console.log('     • POST /api/payments/start           - Iniciar pago');
  console.log('     • POST /api/stripe/create-checkout   - Crear sesión Stripe (legacy)');
  console.log('     • POST /api/webhooks/stripe          - Webhook Stripe');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

