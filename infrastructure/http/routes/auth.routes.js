/**
 * Auth Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/auth.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Definición de rutas de autenticación
 */

import express from 'express';
import { register, login } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authRateLimiter, register);

// POST /api/auth/login - Login (requiere autenticación Firebase)
router.post('/login', authRateLimiter, authenticate, login);

export default router;
