/**
 * Layer: Infrastructure
 * File: Energy.routes.js
 * Responsibility:
 * Registers Express routes for energy management endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import {
  activateTrialEndpoint,
  getEnergy,
  getTrialStatusEndpoint,
} from '../controllers/EnergyController.js';
import { authenticate } from '../middlewares/authenticate.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter); // Apply rate limiting to all energy routes
router.use(authenticate);

router.get('/', getEnergy);
router.post('/trial/activate', activateTrialEndpoint);
router.get('/trial/status', getTrialStatusEndpoint);

export default router;
