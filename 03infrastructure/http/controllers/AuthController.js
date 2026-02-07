/**
 * Auth Controller (Infrastructure - HTTP Layer)
 *
 * Architecture: Hexagonal (Ports & Adapters)
 *
 * Single Responsibility:
 * - Adapt HTTP (req/res) to Use Cases
 * - Validate HTTP input
 * - Translate errors to HTTP status codes
 * - Contains NO business logic
 */

import { createUser } from '../../../02application/use-cases/auth/CreateUser.js';
import { updateLastLogin } from '../../../02application/use-cases/ManageUser.js';
import { HTTP_STATUS } from '../httpStatus.js';
import { mapErrorToHttp } from '../../mappers/ErrorMapper.js';
import { logger } from '../../logger/logger.js';
import jwt from 'jsonwebtoken';


// Dependency injection
let userRepository;
let passwordHasher;

export function setDependencies(deps) {
  userRepository = deps.userRepository;
  passwordHasher = deps.passwordHasher;
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req, res) {
  try {
    const { email, password, userId } = req.body;

    // HTTP input validation
    if (!email || !password || !userId) {
      const err = new Error("Email, password and userId are required");
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    await createUser(userId, email, password, { userRepository, passwordHasher });

    logger.success(`User registered: ${userId}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: userId,
        email,
        password,
        plan: "pro", // TEMPORARY: matches current use case behavior
      },
    });
  } catch (err) {
    logger.error("Error in register:", err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

/**
 * POST /api/auth/login
 * Update last login
 */
export async function login(req, res) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      const err = new Error('Unauthenticated user');
      err.code = 'AUTHENTICATION_ERROR';
      throw err;
    }

    await updateLastLogin(userId, { userRepository });

    logger.success(`Login successful: ${userId}`);

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(HTTP_STATUS.OK).json({
      token,
      userId,
    });
  } catch (err) {
    logger.error('Error in login:', err);

    const httpError = mapErrorToHttp(err);
    res.status(httpError.status).json(httpError.body);
  }
}

export default {
  register,
  login,
  setDependencies,
};
