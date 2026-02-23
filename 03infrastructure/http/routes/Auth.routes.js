/**
 * Layer: Infrastructure
 * File: Auth.routes.js
 * Responsibility:
 * Registers Express routes for authentication endpoints, binding rate limiting middleware and controllers.
 */

import express from 'express';
import { login, register } from '../controllers/AuthController.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

export default router;
