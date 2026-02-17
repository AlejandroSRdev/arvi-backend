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
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authRateLimiter, register);

// POST /api/auth/login - Login de usuario
router.post('/login', authRateLimiter, login);

export default router;
