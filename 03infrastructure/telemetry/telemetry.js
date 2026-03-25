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

class DebugMetricExporter {
  constructor(delegate) {
    this._delegate = delegate;
  }

  export(metrics, resultCallback) {
    for (const scopeMetrics of metrics.resourceMetrics.scopeMetrics) {
      for (const metric of scopeMetrics.metrics) {
        const points = metric.dataPoints.map((dp) => {
          const value = dp.value?.sum ?? dp.value ?? 0;
          return `${JSON.stringify(dp.attributes)}=${value}`;
        });
        console.log(`[METRIC] ${metric.descriptor.name}: ${points.join(' | ') || '(no data points)'}`);
      }
    }

    this._delegate.export(metrics, (result) => {
      if (result.code === 0) { // 0 = ExportResultCode.SUCCESS
        console.log('[OTEL] Export cycle completed: success');
      } else {
        console.error('[OTEL] Export cycle completed: FAILED', result.error?.message ?? 'unknown error');
      }
      resultCallback(result);
    });
  }

  forceFlush() {
    return this._delegate.forceFlush?.() ?? Promise.resolve();
  }

  shutdown() {
    return this._delegate.shutdown();
  }
}

const metricExporter = new OTLPMetricExporter({
  url: endpoint,
  headers: {
    Authorization: authorization,
  },
});

const debugExporter = new DebugMetricExporter(metricExporter);

const sdk = new NodeSDK({
  serviceName,
  metricReader: new PeriodicExportingMetricReader({
    exporter: debugExporter,
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
