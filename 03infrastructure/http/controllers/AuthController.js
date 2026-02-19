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

import { createUser } from '../../../02application/use-cases/CreateUser.js';
import { loginUser } from '../../../02application/use-cases/LoginUser.js';
import { HTTP_STATUS } from '../HttpStatus.js';
import { ValidationError } from '../../../errors/Index.js';
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

    console.log(`[${new Date().toISOString()}] AUTH_REGISTER_ATTEMPT email=${email}`);

    // HTTP input validation
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const { userId } = await createUser(
      email,
      password,
      { userRepository, passwordHasher }
    );

    console.log(`AUTH_REGISTER_SUCCESS userId=${userId}`);

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
    console.error(`AUTH_REGISTER_ERROR error=${err.constructor.name} message=${err.message}`);
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

    console.log(`[${new Date().toISOString()}] AUTH_LOGIN_ATTEMPT email=${email}`);

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

    console.log(`AUTH_LOGIN_SUCCESS userId=${userId}`);

    return res.status(HTTP_STATUS.OK).json({
      token,
      userId,
    });
  } catch (err) {
    console.error(`AUTH_LOGIN_ERROR error=${err.constructor.name} message=${err.message}`);
    return next(err);
  }
}

export default {
  register,
  login,
  setDependencies,
};
