/** Union type of all infrastructure-level error codes. */
export type InfrastructureErrorCode =
  | 'AI_TEMPORARY_UNAVAILABLE'
  | 'AI_PROVIDER_FAILURE'
  | 'DATA_ACCESS_FAILURE'
  | 'TRANSACTION_FAILURE'
  | 'UNKNOWN_INFRASTRUCTURE_ERROR';
