/**
 * Layer: Infrastructure
 * File: AppMetrics.js
 * Responsibility:
 * Defines all OTEL metric instruments for the system.
 * Imported by infrastructure components only.
 * The meter is backed by the SDK initialized in telemetry.js via --import.
 */

import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('arvi-backend');

// HTTP
export const httpRequestsTotal = meter.createCounter('http_requests_total', {
  description: 'Total HTTP requests received',
});

export const httpRequestDurationMs = meter.createHistogram('http_request_duration_ms', {
  description: 'HTTP request duration in milliseconds',
  advice: { explicitBucketBoundaries: [50, 100, 200, 500, 1000, 3000, 10000] },
});

export const httpErrorsTotal = meter.createCounter('http_errors_total', {
  description: 'Total HTTP error responses',
});

export const userRegistrationsTotal = meter.createCounter('user_registrations_total', {
  description: 'Total user registrations completed',
});

// AI
export const aiRequestsTotal = meter.createCounter('ai_requests_total', {
  description: 'Total AI pipeline executions',
});

export const aiLatencyMs = meter.createHistogram('ai_latency_ms', {
  description: 'AI pipeline total duration in milliseconds',
  advice: { explicitBucketBoundaries: [500, 1000, 2000, 5000, 10000, 30000, 60000] },
});

export const aiErrorsTotal = meter.createCounter('ai_errors_total', {
  description: 'Total AI pipeline failures',
});

export const aiTokensTotal = meter.createCounter('ai_tokens_total', {
  description: 'Total tokens consumed by AI provider calls',
});

// Billing
export const billingCheckoutCreated = meter.createCounter('billing_checkout_created', {
  description: 'Total Stripe checkout sessions created',
});

export const billingWebhookReceived = meter.createCounter('billing_webhook_received', {
  description: 'Total Stripe webhook events received',
});

export const billingWebhookSuccess = meter.createCounter('billing_webhook_success', {
  description: 'Total Stripe webhook events successfully processed',
});

export const billingWebhookErrors = meter.createCounter('billing_webhook_errors', {
  description: 'Total Stripe webhook processing errors',
});
