import { BaseError } from '../base/BaseError.js';

interface Metadata {
  readonly required: number;
  readonly available: number;
}

/** Thrown when a user does not have enough energy to perform the action. */
export class InsufficientEnergyError extends BaseError<
  'INSUFFICIENT_ENERGY',
  Metadata
> {
  constructor(required: number, available: number) {
    super({
      code: 'INSUFFICIENT_ENERGY',
      message: 'Insufficient energy',
      metadata: { required, available },
    });
  }
}
