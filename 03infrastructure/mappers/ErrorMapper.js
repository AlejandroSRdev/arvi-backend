import { HTTP_STATUS } from '../http/HttpStatus.js';

/**
 * Maps domain/application errors to HTTP responses.
 * This is the ONLY place where errors are translated to HTTP semantics.
 */
export function mapErrorToHttp(error) {
  // ─────────────────────────────────────────────
  // DOMAIN ERRORS
  // ─────────────────────────────────────────────

  if (error.code === 'INSUFFICIENT_ENERGY') {
    return {
      status: HTTP_STATUS.FORBIDDEN,
      body: {
        error: 'INSUFFICIENT_ENERGY',
        message: 'Insufficient energy',
        details: {
          required: error.required,
          available: error.available,
        },
      },
    };
  }

  if (error.code === 'TRIAL_ALREADY_USED') {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      body: {
        error: 'TRIAL_ALREADY_USED',
        message: 'Trial already used',
      },
    };
  }

  // ─────────────────────────────────────────────
  // APPLICATION ERRORS
  // ─────────────────────────────────────────────

  if (error.code === 'VALIDATION_ERROR') {
    return {
      status: HTTP_STATUS.BAD_REQUEST,
      body: {
        error: 'VALIDATION_ERROR',
        message: error.message,
      },
    };
  }

  if (error.code === 'AUTHENTICATION_ERROR') {
    return {
      status: HTTP_STATUS.UNAUTHORIZED,
      body: {
        error: 'AUTHENTICATION_ERROR',
        message: error.message ?? 'Not authenticated',
      },
    };
  }

  if (error.code === 'AUTHORIZATION_ERROR') {
    return {
      status: HTTP_STATUS.FORBIDDEN,
      body: {
        error: 'AUTHORIZATION_ERROR',
        message: error.message ?? 'Not authorized',
      },
    };
  }

  if (error.code === 'NOT_FOUND') {
    return {
      status: HTTP_STATUS.NOT_FOUND,
      body: {
        error: 'NOT_FOUND',
        message: error.message,
      },
    };
  }

  // ─────────────────────────────────────────────
  // INFRASTRUCTURE ERRORS
  // ─────────────────────────────────────────────

  if (error.code === 'AI_TEMPORARY_UNAVAILABLE') {
    return {
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      body: {
        error: 'AI_UNAVAILABLE',
        message: 'AI service temporarily unavailable',
      },
    };
  }

  if (error.code === 'AI_PROVIDER_FAILURE') {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      body: {
        error: 'AI_FAILURE',
        message: 'AI provider failure',
      },
    };
  }

  if (error.code === 'DATA_ACCESS_FAILURE') {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      body: {
        error: 'DATA_ERROR',
        message: 'Data access failure',
      },
    };
  }

  if (error.code === 'TRANSACTION_FAILURE') {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      body: {
        error: 'TRANSACTION_ERROR',
        message: 'Transaction failed',
      },
    };
  }

  if (error.code === 'UNKNOWN_INFRASTRUCTURE_ERROR') {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      body: {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    };
  }

  // ─────────────────────────────────────────────
  // FALLBACK (UNEXPECTED ERRORS)
  // ─────────────────────────────────────────────

  return {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    body: {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  };
}
