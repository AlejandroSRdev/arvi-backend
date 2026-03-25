TASK: Implement custom metrics using OpenTelemetry Metrics API

---

PURPOSE

Add operational metrics to the system so that production behavior — request traffic,
AI pipeline cost and latency, and billing flow outcomes — can be observed in Grafana.

This is observability infrastructure only. No business logic changes.

---

SCOPE

INCLUDED:
- Create 03infrastructure/metrics/AppMetrics.js (new file)
- Modify 03infrastructure/http/middlewares/requestLogger.js
- Modify 03infrastructure/http/middlewares/errorMiddleware.js
- Modify 03infrastructure/http/controllers/AuthController.js
- Modify 03infrastructure/http/controllers/HabitSeriesController.js
- Modify 03infrastructure/ai/gemini/GeminiAdapter.js
- Modify 03infrastructure/ai/openai/OpenAIAdapter.js
- Modify 03infrastructure/http/controllers/BillingController.js

EXCLUDED:
- No changes to any file in 01domain/ or 02application/
- No changes to server.js
- No changes to telemetry.js
- No new npm packages (use @opentelemetry/api which is already a transitive dependency)
- No dashboard or Grafana configuration
- No retry metrics (no retries exist in the system)

---

FILES

CREATE:
  03infrastructure/metrics/AppMetrics.js

MODIFY:
  03infrastructure/http/middlewares/requestLogger.js
  03infrastructure/http/middlewares/errorMiddleware.js
  03infrastructure/http/controllers/AuthController.js
  03infrastructure/http/controllers/HabitSeriesController.js
  03infrastructure/ai/gemini/GeminiAdapter.js
  03infrastructure/ai/openai/OpenAIAdapter.js
  03infrastructure/http/controllers/BillingController.js

---

REQUIREMENTS

STEP 1 — CREATE 03infrastructure/metrics/AppMetrics.js

The file must contain exactly this content:

```js
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
```

---

STEP 2 — MODIFY requestLogger.js

Add this import at the top of the file:
```js
import { httpRequestsTotal, httpRequestDurationMs } from '../../metrics/AppMetrics.js';
```

Inside the res.on('finish', ...) callback, after the existing logger.log('http.response', ...) call,
add the following two lines:

```js
const route = (req.baseUrl ?? '') + (req.route?.path ?? 'unmatched');
httpRequestsTotal.add(1, { method: req.method, route, status: String(res.statusCode) });
httpRequestDurationMs.record(Date.now() - start, { method: req.method, route });
```

The variable `start` already exists in the enclosing scope of requestLogger.
Do not redefine it.

---

STEP 3 — MODIFY errorMiddleware.js

Add this import at the top of the file:
```js
import { httpErrorsTotal } from '../../metrics/AppMetrics.js';
```

In the BaseError branch, after the mapErrorToHttp call and before the res.status(...).json(...) return,
add:
```js
const route = (req.baseUrl ?? '') + (req.route?.path ?? 'unmatched');
httpErrorsTotal.add(1, { method: req.method, route, status: String(httpError.status) });
```

In the unexpected error branch (the second logger.logError block), before the res.status(500) return,
add:
```js
const route = (req.baseUrl ?? '') + (req.route?.path ?? 'unmatched');
httpErrorsTotal.add(1, { method: req.method, route, status: '500' });
```

---

STEP 4 — MODIFY AuthController.js

Add this import at the top of the file:
```js
import { userRegistrationsTotal } from '../../metrics/AppMetrics.js';
```

In the register function, after the console.log('AUTH_REGISTER_SUCCESS ...') line
and before the return res.status(HTTP_STATUS.CREATED).json(...) line, add:
```js
userRegistrationsTotal.add(1);
```

Do not modify the login function.

---

STEP 5 — MODIFY HabitSeriesController.js

Add this import at the top of the file:
```js
import { aiRequestsTotal, aiLatencyMs, aiErrorsTotal } from '../../metrics/AppMetrics.js';
```

In createHabitSeriesEndpoint, replace the single line:
```js
const habitSeries = await createHabitSeries(userId, payload, {
  planId: req.plan,
  userRepository,
  habitSeriesRepository,
  aiProvider,
  requestId,
});
```

With:
```js
const aiStart = Date.now();
let habitSeries;
try {
  habitSeries = await createHabitSeries(userId, payload, {
    planId: req.plan,
    userRepository,
    habitSeriesRepository,
    aiProvider,
    requestId,
  });
  aiRequestsTotal.add(1, { feature: 'createHabitSeries' });
  aiLatencyMs.record(Date.now() - aiStart, { feature: 'createHabitSeries' });
} catch (aiErr) {
  aiErrorsTotal.add(1, { feature: 'createHabitSeries', error_type: aiErr.code ?? aiErr.name ?? 'UNKNOWN' });
  throw aiErr;
}
```

In createActionEndpoint, replace the single line:
```js
const action = await createAction(userId, seriesId, { language }, {
  planId: req.plan,
  userRepository,
  habitSeriesRepository,
  aiProvider,
  requestId,
});
```

With:
```js
const aiStart = Date.now();
let action;
try {
  action = await createAction(userId, seriesId, { language }, {
    planId: req.plan,
    userRepository,
    habitSeriesRepository,
    aiProvider,
    requestId,
  });
  aiRequestsTotal.add(1, { feature: 'createAction' });
  aiLatencyMs.record(Date.now() - aiStart, { feature: 'createAction' });
} catch (aiErr) {
  aiErrorsTotal.add(1, { feature: 'createAction', error_type: aiErr.code ?? aiErr.name ?? 'UNKNOWN' });
  throw aiErr;
}
```

Do not modify any other function in this controller.

---

STEP 6 — MODIFY GeminiAdapter.js

Add this import at the top of the file, after existing imports:
```js
import { aiTokensTotal } from '../../metrics/AppMetrics.js';
```

After the line `const tokensUsed = totalTokens;` and before the line
`const energyConsumed = calculateGeminiEnergy(prompt, content);`, add:
```js
aiTokensTotal.add(tokensUsed, { model, provider: 'gemini' });
```

The variable `model` is already in scope from the options destructuring at the top of callAI.
The variable `tokensUsed` is already defined on the line above.

---

STEP 7 — MODIFY OpenAIAdapter.js

Add this import at the top of the file, after existing imports:
```js
import { aiTokensTotal } from '../../metrics/AppMetrics.js';
```

After the line `const tokensUsed = total_tokens;` and before the response object construction,
add:
```js
aiTokensTotal.add(tokensUsed, { model: completion.model, provider: 'openai' });
```

The variable `completion` is already in scope from the API call above.

---

STEP 8 — MODIFY BillingController.js

Add this import at the top of the file, after existing imports:
```js
import {
  billingCheckoutCreated,
  billingWebhookReceived,
  billingWebhookSuccess,
  billingWebhookErrors,
} from '../../metrics/AppMetrics.js';
```

In createCheckoutSessionEndpoint, after the logger.log('billing.checkout.response_sent', ...)
call and before the return res.status(HTTP_STATUS.OK).json(...) line, add:
```js
billingCheckoutCreated.add(1, { plan: plan?.toUpperCase() ?? 'unknown' });
```

In stripeWebhookEndpoint, perform these four additions:

a) After the logger.log('stripe_webhook_received', ...) call, add:
```js
billingWebhookReceived.add(1, { event_type: event.type });
```

b) After the processStripeWebhook call succeeds and before the return res.status(HTTP_STATUS.OK)
that follows it, add:
```js
billingWebhookSuccess.add(1, { event_type: event.type });
```

c) In the catch block, in the isTransientError branch, before the return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR), add:
```js
billingWebhookErrors.add(1, { event_type: event.type, error_type: 'TRANSIENT' });
```

d) In the catch block, in the non-retryable branch (the else after the isTransientError check),
before the return res.status(HTTP_STATUS.OK).json({ received: true }), add:
```js
billingWebhookErrors.add(1, { event_type: event.type, error_type: 'NON_RETRYABLE' });
```

e) In the signature verification try/catch, before the return res.status(HTTP_STATUS.BAD_REQUEST)
that handles invalid signatures, add:
```js
billingWebhookErrors.add(1, { event_type: 'unknown', error_type: 'INVALID_SIGNATURE' });
```

---

NON-GOALS

- Do not add try/catch around metric calls. The OTEL SDK provides a NOOP meter as fallback.
- Do not add metric calls to functions not listed above.
- Do not change any existing log statements.
- Do not change any existing error handling flow.
- Do not add any userId, seriesId, or any other per-user value as a metric label.
- Do not add metrics to 01domain/ or 02application/ files.
- Do not create helper functions or wrappers around metric calls.
- Do not modify the existing catch(err) → next(err) pattern in any controller.
  The inner try/catch in STEP 5 re-throws so the outer catch remains effective.

---

CONSTRAINTS

- @opentelemetry/api is already available as a transitive dependency. Do not add it to package.json.
- All metric names must match exactly as defined in AppMetrics.js.
- All label keys must be lowercase with underscores (method, route, status, feature, error_type, model, provider, plan, event_type).
- The status label must be a string (use String(res.statusCode), not the numeric value).
- Route label must use Express template: (req.baseUrl ?? '') + (req.route?.path ?? 'unmatched').
  This normalizes /api/habits/series/abc123 to /api/habits/series/:seriesId.

---

DELIVERABLES

1. Complete content of 03infrastructure/metrics/AppMetrics.js
2. Full modified content of each of the 7 files listed in FILES → MODIFY
3. Verification: confirm that @opentelemetry/api resolves without error by checking
   that node_modules/@opentelemetry/api exists
