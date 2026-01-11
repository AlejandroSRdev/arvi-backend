// Custom error class for validation errors

export class ValidationError extends Error {
  constructor(message = 'Invalid request') {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}
