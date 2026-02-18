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
