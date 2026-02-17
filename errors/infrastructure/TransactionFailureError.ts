import { InfrastructureError } from './InfrastructureError.ts';

interface Metadata {
  readonly operation: string;
}

/** Thrown when a transactional operation fails. */
export class TransactionFailureError extends InfrastructureError<
  'TRANSACTION_FAILURE',
  Metadata
> {
  constructor(params: { operation: string; cause?: unknown }) {
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
