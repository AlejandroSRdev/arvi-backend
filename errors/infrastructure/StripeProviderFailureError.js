/**
 * Layer: Errors
 * File: StripeProviderFailureError.js
 * Responsibility:
 * Classifies a Stripe API call failure at the infrastructure boundary.
 */

import { InfrastructureError } from './InfrastructureError.js';

export class StripeProviderFailureError extends InfrastructureError {
  constructor(params) {
    super({
      code: 'STRIPE_PROVIDER_FAILURE',
      message: `Stripe provider failure during "${params.operation}": ${params.message}`,
      metadata: {
        operation: params.operation,
      },
      cause: params.cause,
    });
  }
}
