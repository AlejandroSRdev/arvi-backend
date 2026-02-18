import { InfrastructureError } from './InfrastructureError.js';

export class TransactionFailureError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'TRANSACTION_FAILURE',
      message: `Transaction failure during "${params.operation}"`,
      metadata: {
        operation: params.operation,
      },
      cause: params.cause,
    });
  }
}
