/**
 * Shared Error Types
 *
 * ORIGEN: src/utils/errorTypes.js (MOVIDO COMPLETO)
 *
 * Responsabilidades:
 * - Definición de errores personalizados
 * - Clases de error compartidas
 *
 * NO CONTIENE:
 * - Lógica de negocio
 * - Dependencias externas
 */

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'No autenticado') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class InsufficientEnergyError extends Error {
  constructor(required, available) {
    super(`Energía insuficiente. Requerida: ${required}, Disponible: ${available}`);
    this.name = 'InsufficientEnergyError';
    this.statusCode = 403;
    this.required = required;
    this.available = available;
  }
}

export class TrialAlreadyUsedError extends Error {
  constructor() {
    super('Trial ya fue utilizado previamente');
    this.name = 'TrialAlreadyUsedError';
    this.statusCode = 400;
  }
}

export default {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InsufficientEnergyError,
  TrialAlreadyUsedError,
};
