/**
 * Abstract base error for all application layers.
 *
 * @typeParam TCode - Union string type representing the error code.
 * @typeParam TMetadata - Structured metadata associated with the error.
 */
export abstract class BaseError<
  TCode extends string,
  TMetadata extends object,
> extends Error {
  readonly code: TCode;
  readonly metadata: TMetadata;
  readonly cause?: unknown;

  constructor(params: {
    code: TCode;
    message: string;
    metadata?: TMetadata;
    cause?: unknown;
  }) {
    super(params.message);

    this.name = new.target.name;
    this.code = params.code;
    this.metadata = params.metadata ?? ({} as TMetadata);
    this.cause = params.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
