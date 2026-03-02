/**
 * Layer: Infrastructure
 * File: Energy.routes.js
 * Responsibility:
 * Registers Express routes for energy management endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import { authenticate } from '../03infrastructure/http/middlewares/authenticate.js';
import { generalRateLimiter } from '../03infrastructure/http/middlewares/rateLimiter.js';
import {
    activateTrialEndpoint,
    getEnergy,
    getTrialStatusEndpoint,
} from './EnergyController.js';

const router = express.Router();

router.use(generalRateLimiter);
router.use(authenticate);

router.get('/', getEnergy);
router.post('/trial/activate', activateTrialEndpoint);
router.get('/trial/status', getTrialStatusEndpoint);

export default router;
