/**
 * Auth Routes (Infrastructure - HTTP)
 * Responsabilidades:
 * - Definición de rutas de autenticación
 */

import express from 'express';
import { login, register } from '../controllers/AuthController.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authRateLimiter, register);

// POST /api/auth/login - Login de usuario
router.post('/login', authRateLimiter, login);

export default router;
