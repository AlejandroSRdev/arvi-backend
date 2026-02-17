import { BaseError } from '../base/BaseError';

interface Metadata {
  readonly entity: string;
  readonly id?: string;
}

/** Thrown when a requested entity cannot be found. */
export class NotFoundError extends BaseError<'NOT_FOUND', Metadata> {
  constructor(entity: string, id?: string) {
    super({
      code: 'NOT_FOUND',
      message: `${entity} not found`,
      metadata: { entity, id },
    });
  }
}
