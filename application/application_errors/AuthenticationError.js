// Custom error class for authentication errors

export class AuthenticationError extends Error {
  constructor(message = 'Authentication error') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}