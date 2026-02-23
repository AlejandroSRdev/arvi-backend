/**
 * Layer: Errors
 * File: InfrastructureError.js
 * Responsibility:
 * Serves as the base class for all infrastructure-layer errors, establishing the classification boundary between technical failures and domain or application errors.
 */
import { BaseError } from '../base/BaseError.js';

export class InfrastructureError extends BaseError {
  constructor(params) {
    super(params);
  }
}
