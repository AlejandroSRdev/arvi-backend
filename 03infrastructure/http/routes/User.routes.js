/**
 * Layer: Infrastructure
 * File: User.routes.js
 * Responsibility:
 * Registers Express routes for user management endpoints, binding authentication middleware and controllers.
 */

import express from 'express';
import {
  deleteAccount,
  getProfile,
  getSubscription,
  updateProfile,
} from '../controllers/UserController.js';
import { authenticate } from '../middlewares/authenticate.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter); // Apply rate limiting to all user routes
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/subscription', getSubscription);
router.delete('/account', deleteAccount);

export default router;
