import { BaseError } from '../base/BaseError.js';

export class InfrastructureError extends BaseError {
  constructor(params) {
    super(params);
  }
}
