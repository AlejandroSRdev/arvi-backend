import { BaseError } from '../base/BaseError.js';

export class NotFoundError extends BaseError {
  constructor(entity, id) {
    super({
      code: 'NOT_FOUND',
      message: `${entity} not found`,
      metadata: { entity, id },
    });
  }
}
