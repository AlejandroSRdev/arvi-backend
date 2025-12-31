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
import bodyParser from 'body-parser';

// Importar rutas (Hexagonal Architecture)
import aiRoutes from './infrastructure/http/routes/ai.routes.js';
import authRoutes from './infrastructure/http/routes/auth.routes.js';
import energyRoutes from './infrastructure/http/routes/energy.routes.js';
import userRoutes from './infrastructure/http/routes/user.routes.js';
import stripeRoutes from './infrastructure/http/routes/stripe.routes.js';
import webhookRoutes from './infrastructure/http/routes/webhook.routes.js';

// Importar middleware (Hexagonal Architecture)
import { errorHandler } from './infrastructure/http/middleware/errorHandler.js';

// Importar configuración Firebase (Hexagonal Architecture)
import { initializeFirebase } from './infrastructure/persistence/firestore/FirebaseConfig.js';

// Inicializar Firebase Admin SDK
initializeFirebase();

const app = express();

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN GENERAL
// ═══════════════════════════════════════════════════════════════

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
    version: '2.0.0',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 ARVI Backend API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      ai: 'POST /api/ai/chat, POST /api/ai/json-convert',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      energy: 'GET /api/energy, POST /api/energy/consume',
      user: 'GET /api/user/profile, PATCH /api/user/profile',
      stripe: 'POST /api/stripe/create-checkout',
      webhook: 'POST /api/webhooks/stripe',
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// RUTAS API (NUEVA ARQUITECTURA)
// ═══════════════════════════════════════════════════════════════

app.use('/api/ai', aiRoutes);           // ✅ Endpoints de IA
app.use('/api/auth', authRoutes);       // ✅ Autenticación
app.use('/api/energy', energyRoutes);   // ✅ Gestión de energía
app.use('/api/user', userRoutes);       // ✅ Gestión de usuarios
app.use('/api/stripe', stripeRoutes);   // ✅ Pagos y suscripciones
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
      'POST /api/ai/chat',
      'POST /api/ai/json-convert',
      'GET /api/energy',
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
  console.log('  🚀 ARVI Backend Server v2.0.0');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Puerto:          ${PORT}`);
  console.log(`  🌍 Entorno:         ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 URL:             http://localhost:${PORT}`);
  console.log('');
  console.log('  ✅ Rutas activas:');
  console.log('     • GET  /health                    - Health check');
  console.log('     • GET  /                          - Info API');
  console.log('     • POST /api/ai/chat               - Chat con IA');
  console.log('     • POST /api/ai/json-convert       - Conversión JSON');
  console.log('     • GET  /api/energy                - Consultar energía');
  console.log('     • POST /api/stripe/create-checkout - Crear sesión Stripe');
  console.log('     • POST /api/webhooks/stripe        - Webhook Stripe');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

