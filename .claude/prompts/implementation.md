TASK: Add DebugMetricExporter to telemetry.js for metric pipeline visibility

---

PURPOSE

Wrap the existing OTLPMetricExporter with a delegating exporter that logs metric values
to stdout on every export cycle. This allows confirming in Render logs that:
1. The SDK is initialized and the export cycle is firing (every 60s)
2. Metric instruments are accumulating values
3. The OTLP export to Grafana is succeeding or failing

No new npm packages. No changes outside telemetry.js.

---

SCOPE

INCLUDED:
- Modify 03infrastructure/telemetry/telemetry.js only

EXCLUDED:
- No changes to AppMetrics.js
- No changes to any controller, middleware, adapter, or use case
- No new files
- No new npm packages
- No changes to package.json or render.yaml

---

FILES

MODIFY:
  03infrastructure/telemetry/telemetry.js

---

REQUIREMENTS

Read the current content of 03infrastructure/telemetry/telemetry.js before making changes.

The file must be modified as follows:

STEP 1 — Add ExportResultCode import

Add ExportResultCode to the existing @opentelemetry/sdk-metrics import.
The current import is:
  import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

Replace it with:
  import { PeriodicExportingMetricReader, ExportResultCode } from '@opentelemetry/sdk-metrics';

STEP 2 — Add DebugMetricExporter class

Insert the following class definition after the existing console.log block
(after the line: console.log(`[OTEL] authorization  = ${authorization ? 'SET' : '⚠ NOT SET'}`);)
and before the OTLPMetricExporter instantiation.

The class must be exactly:

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
      if (result.code === ExportResultCode.SUCCESS) {
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

STEP 3 — Wrap the OTLPMetricExporter with DebugMetricExporter

The current code instantiates the exporter and passes it directly to PeriodicExportingMetricReader:

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
    ...
  });

Replace so that DebugMetricExporter wraps metricExporter before being passed to the reader:

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
    ...
  });

Do not change any other part of the file.

---

NON-GOALS

- Do not add a conditional (no env var guard). The exporter logs unconditionally.
- Do not modify the exportIntervalMillis value.
- Do not add try/catch inside DebugMetricExporter methods.
- Do not change the existing console.log statements at the top of telemetry.js.
- Do not add the class to AppMetrics.js or any other file.
- Do not change how sdk.start() is called.

---

CONSTRAINTS

- ExportResultCode is exported from @opentelemetry/sdk-metrics, which is already a direct dependency.
- The DebugMetricExporter must implement the PushMetricExporter interface:
  export(), forceFlush(), shutdown(). No other methods required.
- dp.value?.sum handles Counter data points (which accumulate as a sum).
  dp.value handles Histogram and other types. The fallback to 0 is correct.
- The class must be defined before the OTLPMetricExporter instantiation in the file.

---

DELIVERABLES

1. Full modified content of 03infrastructure/telemetry/telemetry.js
2. Confirm that the three structural changes are present:
   a. ExportResultCode imported from @opentelemetry/sdk-metrics
   b. DebugMetricExporter class defined before OTLPMetricExporter instantiation
   c. debugExporter passed to PeriodicExportingMetricReader instead of metricExporter directly
