import { InfrastructureError } from './InfrastructureError.js';

export class DataAccessFailureError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'DATA_ACCESS_FAILURE',
      message: `Data access failure during "${params.operation}"`,
      metadata: {
        operation: params.operation,
        collection: params.collection,
      },
      cause: params.cause,
    });
  }
}
