/**
 * Layer: Infrastructure
 * File: authenticate.js
 * Responsibility:
 * Verifies JWT tokens issued by this backend and attaches the decoded user identity to the request.
 */

import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../../../errors/Index.js';

/**
 * Extract and verify a Bearer token from the Authorization header.
 * Returns the decoded payload or null if extraction fails.
 */
function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Required authentication middleware.
 * Rejects with AuthenticationError if token is missing or invalid.
 */
export async function authenticate(req, res, next) {
  try {
    const decoded = verifyToken(req);

    if (!decoded) {
      throw new AuthenticationError('Authentication token not provided');
    }

    // uid kept as alias for backward compatibility with existing controllers
    req.user = {
      id: decoded.userId,
      uid: decoded.userId,
    };

    next();
  } catch (error) {
    return next(
      error instanceof AuthenticationError
        ? error
        : new AuthenticationError('Invalid or expired token')
    );
  }
}

/**
 * Optional authentication middleware.
 * Continues without user if token is absent or invalid.
 */
export async function optionalAuth(req, res, next) {
  try {
    const decoded = verifyToken(req);

    if (decoded) {
      req.user = {
        id: decoded.userId,
        uid: decoded.userId,
      };
    }

    next();
  } catch (error) {
    // Token invalid — continue without user
    next();
  }
}

export default { authenticate, optionalAuth };
