import { InfrastructureError } from './InfrastructureError.ts';

interface Metadata {
  readonly operation: string;
  readonly collection?: string;
}

/** Thrown when a data access operation fails. */
export class DataAccessFailureError extends InfrastructureError<
  'DATA_ACCESS_FAILURE',
  Metadata
> {
  constructor(params: {
    operation: string;
    collection?: string;
    cause?: unknown;
  }) {
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
