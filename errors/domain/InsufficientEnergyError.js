/**
 * Layer: Errors
 * File: InsufficientEnergyError.js
 * Responsibility:
 * Classifies an energy-constraint domain rule violation, carrying required and available values as metadata for upstream handling.
 */
import { BaseError } from '../base/BaseError.js';

export class InsufficientEnergyError extends BaseError {
  constructor(required, available) {
    super({
      code: 'INSUFFICIENT_ENERGY',
      message: 'Insufficient energy',
      metadata: { required, available },
    });
  }
}
