/**
 * Energy Routes (Infrastructure - HTTP)
 *
 * MIGRADO DESDE: src/routes/energy.routes.js (COMPLETO)
 * SIN CAMBIOS DE COMPORTAMIENTO
 *
 * Responsabilidades:
 * - Definición de rutas de gestión de energía
 */

import express from 'express';
import {
  getEnergy,
  activateTrialEndpoint,
  getTrialStatusEndpoint,
} from '../controllers/EnergyController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/user/energy - Obtener energía actual
router.get('/', getEnergy);

// POST /api/user/trial/activate - Activar trial
router.post('/trial/activate', activateTrialEndpoint);

// GET /api/user/trial/status - Estado del trial
router.get('/trial/status', getTrialStatusEndpoint);

export default router;
