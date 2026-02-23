/**
 * Layer: Errors
 * File: Index.js
 * Responsibility:
 * Re-exports all application-layer error classes as a unified module boundary for the application error sublayer.
 */
export { ValidationError } from './ValidationError.js';
export { AuthenticationError } from './AuthenticationError.js';
export { AuthorizationError } from './AuthorizationError.js';
export { NotFoundError } from './NotFoundError.js';
