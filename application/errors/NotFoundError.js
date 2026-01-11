// Custom error class for not found scenarios

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}
