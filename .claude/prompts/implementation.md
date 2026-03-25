# IMPLEMENTATION TASK — OpenTelemetry Metrics Layer (Block 2)

---

## 1. PURPOSE

Integrate OpenTelemetry into the backend so that HTTP request metrics (latency histograms, throughput, error rate) are exported automatically to Grafana Cloud via OTLP HTTP.

This enables RED metrics (Rate, Errors, Duration) per endpoint in Grafana without touching any controller, use case, or domain file.

---

## 2. SCOPE

### INCLUDED

- Install 4 npm packages (OTEL SDK + auto-instrumentations + metrics exporter)
- Create `03infrastructure/telemetry/telemetry.js` — SDK initialization
- Modify `package.json` start script to load telemetry before all other modules
- Add 3 env vars to `.env` and `.env.example` (if it exists)

### EXCLUDED

- No changes to `server.js` imports or body
- No changes to any controller, use case, service, repository, or domain file
- No custom metrics (counters, gauges) — auto-instrumentation only
- No trace exporter — metrics only
- No changes to `Logger.js` or `requestLogger.js`
- No new middleware

---

## 3. FILES

### Create
- `03infrastructure/telemetry/telemetry.js`

### Modify
- `package.json` — start script only
- `.env` — add 3 env vars (with placeholder values, no real secrets)
- `.env.example` — add same 3 vars if file exists

---

## 4. REQUIREMENTS

### 4.1 — Install packages

Run exactly:
```
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-metrics-otlp-http @opentelemetry/sdk-metrics
```

### 4.2 — `03infrastructure/telemetry/telemetry.js`

Create this file with the following exact content:

```js
/**
 * Layer: Infrastructure
 * File: telemetry.js
 * Responsibility:
 * Initializes the OpenTelemetry SDK with HTTP auto-instrumentation and
 * OTLP metric export to Grafana Cloud. Must be loaded before all other
 * modules via the --import Node.js flag.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  headers: {
    Authorization: process.env.OTEL_EXPORTER_OTLP_AUTHORIZATION,
  },
});

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'arvi-backend',
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
```

Constraints:
- Do NOT use `require()` — this project uses ES Modules throughout
- `fs` instrumentation is disabled — it generates excessive noise (every file read becomes a span)
- Export interval is 60 seconds — do not change this value
- `OTEL_SERVICE_NAME` defaults to `'arvi-backend'` in code; env var is optional

### 4.3 — `package.json` start script

Locate the `"start"` script in `package.json`. Replace it so it becomes:
```json
"start": "node --import ./03infrastructure/telemetry/telemetry.js server.js"
```

If there is a `"dev"` script, apply the same `--import` prefix to it as well.

Rationale: ES Modules hoist `import` declarations. Using `--import` guarantees the OTEL SDK is initialized and patches Node.js internals before any module in `server.js` is resolved. Adding `import './telemetry.js'` inside `server.js` would NOT work correctly for this reason.

### 4.4 — Environment variables

Add these 3 vars to `.env` with placeholder values (no real secrets):
```
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-eu-central-0.grafana.net/otlp/v1/metrics
OTEL_EXPORTER_OTLP_AUTHORIZATION=Bearer <instanceId>:<token>
OTEL_SERVICE_NAME=arvi-backend
```

If `.env.example` exists, add the same vars with identical placeholder values.

---

## 5. NON-GOALS

- Do NOT add any `import` or `require` of telemetry inside `server.js`
- Do NOT create a custom metric (counter, histogram, gauge) anywhere
- Do NOT configure a trace exporter — the Grafana Cloud endpoint is for metrics only
- Do NOT add OTEL to the synthetic runners — separate block
- Do NOT change `exportIntervalMillis` from 60000
- Do NOT enable `@opentelemetry/instrumentation-fs`
- Do NOT commit real API keys or tokens

---

## 6. DELIVERABLES

1. `03infrastructure/telemetry/telemetry.js` created with exact content from §4.2
2. `package.json` start script updated per §4.3
3. `.env` updated with 3 vars (placeholder values)
4. 4 npm packages installed and reflected in `package.json` dependencies

### Verification

Start the server locally with `npm start`. Confirm:

a) Server boots without error

b) No OTEL crash in console (a warning about missing env vars is acceptable locally if vars are not configured)

c) Make one HTTP request to any endpoint and confirm the server responds normally — the OTEL layer must be transparent to existing behavior
