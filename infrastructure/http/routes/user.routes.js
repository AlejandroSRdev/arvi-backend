/**
 * User Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/user.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Definición de rutas de gestión de usuario
 */

import express from 'express';
import {
  getProfile,
  updateProfile,
  getSubscription,
  deleteAccount,
} from '../controllers/UserController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/user/profile - Obtener perfil
router.get('/profile', getProfile);

// PUT /api/user/profile - Actualizar perfil
router.put('/profile', updateProfile);

// GET /api/user/subscription - Estado de suscripción
router.get('/subscription', getSubscription);

// DELETE /api/user/account - Eliminar cuenta
router.delete('/account', deleteAccount);

export default router;
