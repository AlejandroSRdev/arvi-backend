/**
 * Layer: Infrastructure
 * File: telemetry.js
 * Responsibility:
 * Initializes the OpenTelemetry SDK with HTTP auto-instrumentation and
 * OTLP metric export to Grafana Cloud. Must be loaded before all other
 * modules via the --import Node.js flag.
 */

import 'dotenv/config';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const authorization = process.env.OTEL_EXPORTER_OTLP_HEADERS;
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'arvi-backend';

console.log('[OTEL] Initializing telemetry...');
console.log(`[OTEL] service.name   = ${serviceName}`);
console.log(`[OTEL] endpoint       = ${endpoint ?? '⚠ NOT SET'}`);
console.log(`[OTEL] authorization  = ${authorization ? 'SET' : '⚠ NOT SET'}`);

const metricExporter = new OTLPMetricExporter({
  url: endpoint,
  headers: {
    Authorization: authorization,
  },
});

const sdk = new NodeSDK({
  serviceName,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();
console.log('[OTEL] SDK started. First export in ~60s.');
