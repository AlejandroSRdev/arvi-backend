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
import { ValidationError } from '../../../errors/index.ts';
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
export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    // HTTP input validation
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const { userId } = await createUser(
      email,
      password,
      { userRepository, passwordHasher }
    );

    return res.status(HTTP_STATUS.CREATED).json({
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
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // HTTP input validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
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

    return res.status(HTTP_STATUS.OK).json({
      token,
      userId,
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  register,
  login,
  setDependencies,
};
