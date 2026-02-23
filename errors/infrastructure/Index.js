/**
 * Layer: Errors
 * File: Index.js
 * Responsibility:
 * Re-exports all infrastructure-layer error classes as a unified module boundary for the infrastructure error sublayer.
 */
export { InfrastructureError } from './InfrastructureError.js';
export { AITemporaryUnavailableError } from './AITemporaryUnavailableError.js';
export { AIProviderFailureError } from './AIProviderFailureError.js';
export { DataAccessFailureError } from './DataAccessFailureError.js';
export { TransactionFailureError } from './TransactionFailureError.js';
export { UnknownInfrastructureError } from './UnknownInfrastructureError.js';
