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
import { loginUser } from '../../../02application/use-cases/auth/LoginUser.js';
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
    const { email, password } = req.body;

    // HTTP input validation
    if (!email || !password ) {
      const err = new Error("Email or password are required");
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    await createUser( email, password, { userRepository, passwordHasher });

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
 * Authenticate user with email and password
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // HTTP input validation
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const { userId } = await loginUser(email, password, {
      userRepository,
      passwordHasher,
    });

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.success(`Login successful: ${userId}`);

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
