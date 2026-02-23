/**
 * Layer: Errors
 * File: BaseError.js
 * Responsibility:
 * Defines the shared error contract inherited by all domain, application, and infrastructure errors, establishing uniform code, message, metadata, and cause propagation.
 */
export class BaseError extends Error {
  constructor(params) {
    super(params.message);

    this.name = new.target.name;
    this.code = params.code;
    this.metadata = params.metadata ?? {};
    this.cause = params.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
