import { BaseError } from '../base/BaseError.js';
import { InfrastructureErrorCode } from './infrastructureErrorCodes.js';

/**
 * Abstract base for all infrastructure-level errors.
 * All infrastructure errors must support an optional cause.
 */
export abstract class InfrastructureError<
  TCode extends InfrastructureErrorCode,
  TMetadata extends object,
> extends BaseError<TCode, TMetadata> {
  constructor(params: {
    code: TCode;
    message: string;
    metadata?: TMetadata;
    cause?: unknown;
  }) {
    super(params);
  }
}
