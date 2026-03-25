/**
 * Synthetic Monitoring Runner
 *
 * Simulates real user behavior against the live backend to validate
 * functional correctness of three core domain flows.
 *
 * Assumption: User 2 and User 3 authenticate with the same backend account
 * registered by User 1 in Scenario 1. The three scenarios represent
 * independent behavioral flows of a single Firestore user (register once,
 * then operate across sessions). Series access is user-scoped; sharing a
 * seriesId across scenarios is only valid within the same userId.
 *
 * Execution: node synthetic/runner.js (from project root)
 * Config:    synthetic/.env.synthetic
 */

import { config } from 'dotenv';
config({ path: './synthetic/.env.synthetic' });

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.SYNTHETIC_BASE_URL;
const TIMEOUT_MS = parseInt(process.env.SYNTHETIC_TIMEOUT_MS || '30000', 10);

if (!BASE_URL) {
  console.error('FATAL: SYNTHETIC_BASE_URL is not set in synthetic/.env.synthetic');
  process.exit(1);
}

// ─── SHARED CONTEXT ──────────────────────────────────────────────────────────
// State flows through this object. Only seriesId is shared across scenarios.
// token is refreshed on each login/register.

const ctx = {
  email: null,     // set by Scenario 1 register
  password: null,  // set by Scenario 1 register
  token: null,     // refreshed on each auth step
  userId: null,    // set by Scenario 1 register
  seriesId: null,  // set by Scenario 1, consumed by Scenarios 2 and 3
};

// ─── HTTP CLIENT ─────────────────────────────────────────────────────────────

/**
 * Performs an HTTP request and returns { status, data, latency }.
 * data is null for non-JSON responses (e.g., 204 No Content).
 *
 * @param {string} method
 * @param {string} path
 * @param {object|null} body
 * @param {string|null} token
 * @returns {Promise<{ status: number, data: object|null, latency: number }>}
 */
async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();
  let res;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms: ${method} ${path}`);
    }
    throw new Error(`Network error on ${method} ${path}: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  const latency = Date.now() - start;
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  return { status: res.status, data, latency };
}

// ─── ASSERTIONS ──────────────────────────────────────────────────────────────

function assertStatus(step, res, expected) {
  if (res.status !== expected) {
    throw new Error(
      `[${step}] Expected HTTP ${expected}, got ${res.status}. Body: ${JSON.stringify(res.data)}`
    );
  }
}

function assertString(step, obj, field) {
  if (!obj || typeof obj[field] !== 'string' || obj[field].trim() === '') {
    throw new Error(
      `[${step}] Field '${field}' must be a non-empty string. Got: ${JSON.stringify(obj?.[field])}`
    );
  }
}

function assertArray(step, obj, field, minLen) {
  if (!obj || !Array.isArray(obj[field])) {
    throw new Error(`[${step}] Field '${field}' must be an array. Got: ${typeof obj?.[field]}`);
  }
  if (obj[field].length < minLen) {
    throw new Error(
      `[${step}] Field '${field}' must have at least ${minLen} elements. Got: ${obj[field].length}`
    );
  }
}

function assertEnum(step, value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(
      `[${step}] Field '${field}' must be one of ${JSON.stringify(allowed)}. Got: '${value}'`
    );
  }
}

function assertNotEqual(step, a, b, message) {
  if (a === b) {
    throw new Error(`[${step}] ${message}`);
  }
}

// ─── LOGGER ──────────────────────────────────────────────────────────────────

function log(step, latency, note) {
  const ts = new Date().toISOString();
  const noteStr = note ? ` | ${note}` : '';
  console.log(`  [${ts}] ✓ ${step} | ${latency}ms${noteStr}`);
}

// ─── SCENARIO 1: USER 1 — FULL FLOW ──────────────────────────────────────────
// Steps:
//   1. Register fresh account → store token, userId, email, password
//   2. Create habit series   → store seriesId; verify GET returns 200
//   3. Create action on series → verify actions count increased in GET

async function runScenario1() {
  console.log('\n=== SCENARIO 1: USER 1 — FULL FLOW ===');

  // ── Step 1: Register ───────────────────────────────────────────────────────
  const email = `synth-${Date.now()}@test.arvi`;
  const password = 'SyntheticRunner1!';

  let res = await request('POST', '/api/auth/register', { email, password }, null);

  assertStatus('S1.1_register', res, 201);
  assertString('S1.1_register', res.data, 'token');
  assertString('S1.1_register', res.data?.user, 'id');
  assertString('S1.1_register', res.data?.user, 'email');

  ctx.email = email;
  ctx.password = password;
  ctx.token = res.data.token;
  ctx.userId = res.data.user.id;

  log('S1.1_register', res.latency, `userId=${ctx.userId} email=${email}`);

  // ── Step 2: Create habit series ────────────────────────────────────────────
  res = await request(
    'POST',
    '/api/habits/series',
    {
      language: 'en',
      testData: {
        goal: 'improve focus and concentration',
        age: '30',
        experience: 'beginner',
        frequency: 'daily',
        timeAvailable: '20 minutes',
      },
      assistantContext: '',
    },
    ctx.token
  );

  assertStatus('S1.2_create_series', res, 201);
  assertString('S1.2_create_series', res.data, 'id');
  assertString('S1.2_create_series', res.data, 'title');
  assertString('S1.2_create_series', res.data, 'description');
  assertArray('S1.2_create_series', res.data, 'actions', 3);
  assertString('S1.2_create_series', res.data, 'createdAt');
  assertString('S1.2_create_series', res.data, 'lastActivityAt');

  ctx.seriesId = res.data.id;

  log('S1.2_create_series', res.latency, `seriesId=${ctx.seriesId} actions=${res.data.actions.length}`);

  // ── Step 2 business validation: series exists and is accessible ────────────
  res = await request('GET', `/api/habits/series/${ctx.seriesId}`, null, ctx.token);

  assertStatus('S1.2b_verify_series_exists', res, 200);
  if (res.data.id !== ctx.seriesId) {
    throw new Error(
      `[S1.2b_verify_series_exists] seriesId mismatch: expected ${ctx.seriesId}, got ${res.data.id}`
    );
  }

  const actionsCountBeforeNewAction = res.data.actions?.length ?? 0;

  log('S1.2b_verify_series_exists', res.latency, `actionsCount=${actionsCountBeforeNewAction}`);

  // ── Step 3: Create action on the series ────────────────────────────────────
  res = await request(
    'POST',
    `/api/habits/series/${ctx.seriesId}/actions`,
    { language: 'en' },
    ctx.token
  );

  assertStatus('S1.3_create_action', res, 201);
  assertString('S1.3_create_action', res.data, 'id');
  assertString('S1.3_create_action', res.data, 'name');
  assertString('S1.3_create_action', res.data, 'description');
  assertEnum('S1.3_create_action', res.data.difficulty, 'difficulty', ['low', 'medium', 'high']);

  const actionId = res.data.id;

  log('S1.3_create_action', res.latency, `actionId=${actionId}`);

  // ── Step 3 business validation: action is linked to series ─────────────────
  res = await request('GET', `/api/habits/series/${ctx.seriesId}`, null, ctx.token);

  assertStatus('S1.3b_verify_action_linked', res, 200);

  const actionsCountAfterNewAction = res.data.actions?.length ?? 0;

  if (actionsCountAfterNewAction <= actionsCountBeforeNewAction) {
    throw new Error(
      `[S1.3b_verify_action_linked] Actions count did not increase: before=${actionsCountBeforeNewAction}, after=${actionsCountAfterNewAction}`
    );
  }

  const actionExists = res.data.actions.some((a) => a.id === actionId);
  if (!actionExists) {
    throw new Error(
      `[S1.3b_verify_action_linked] actionId=${actionId} not found in series actions`
    );
  }

  log(
    'S1.3b_verify_action_linked',
    res.latency,
    `actions: ${actionsCountBeforeNewAction} → ${actionsCountAfterNewAction}`
  );
}

// ─── SCENARIO 2: USER 2 — EXISTING STATE USAGE ───────────────────────────────
// Steps:
//   1. Login with Scenario 1 credentials → refresh token
//   2. Read series to record current actions count (pre-condition)
//   3. Create action on the existing series
//   4. Verify actions count increased in GET

async function runScenario2() {
  console.log('\n=== SCENARIO 2: USER 2 — EXISTING STATE USAGE ===');

  if (!ctx.email || !ctx.password || !ctx.seriesId) {
    throw new Error(
      'S2: ctx.email, ctx.password, or ctx.seriesId is missing — Scenario 1 must complete first'
    );
  }

  // ── Step 1: Login ──────────────────────────────────────────────────────────
  let res = await request(
    'POST',
    '/api/auth/login',
    { email: ctx.email, password: ctx.password },
    null
  );

  assertStatus('S2.1_login', res, 200);
  assertString('S2.1_login', res.data, 'token');
  assertString('S2.1_login', res.data, 'userId');

  ctx.token = res.data.token;

  log('S2.1_login', res.latency, `userId=${res.data.userId}`);

  // ── Step 2: Read series — record actions count before new action ───────────
  res = await request('GET', `/api/habits/series/${ctx.seriesId}`, null, ctx.token);

  assertStatus('S2.2_read_series_state', res, 200);
  if (res.data.id !== ctx.seriesId) {
    throw new Error(
      `[S2.2_read_series_state] seriesId mismatch: expected ${ctx.seriesId}, got ${res.data.id}`
    );
  }

  const actionsCountBefore = res.data.actions?.length ?? 0;

  log('S2.2_read_series_state', res.latency, `actionsCount=${actionsCountBefore}`);

  // ── Step 3: Create action on existing series ───────────────────────────────
  res = await request(
    'POST',
    `/api/habits/series/${ctx.seriesId}/actions`,
    { language: 'en' },
    ctx.token
  );

  assertStatus('S2.3_create_action', res, 201);
  assertString('S2.3_create_action', res.data, 'id');
  assertString('S2.3_create_action', res.data, 'name');
  assertString('S2.3_create_action', res.data, 'description');
  assertEnum('S2.3_create_action', res.data.difficulty, 'difficulty', ['low', 'medium', 'high']);

  const actionId = res.data.id;

  log('S2.3_create_action', res.latency, `actionId=${actionId}`);

  // ── Step 4 business validation: action count increased ─────────────────────
  res = await request('GET', `/api/habits/series/${ctx.seriesId}`, null, ctx.token);

  assertStatus('S2.4_verify_action_linked', res, 200);

  const actionsCountAfter = res.data.actions?.length ?? 0;

  if (actionsCountAfter <= actionsCountBefore) {
    throw new Error(
      `[S2.4_verify_action_linked] Actions count did not increase: before=${actionsCountBefore}, after=${actionsCountAfter}`
    );
  }

  const actionExists = res.data.actions.some((a) => a.id === actionId);
  if (!actionExists) {
    throw new Error(
      `[S2.4_verify_action_linked] actionId=${actionId} not found in series actions`
    );
  }

  log(
    'S2.4_verify_action_linked',
    res.latency,
    `actions: ${actionsCountBefore} → ${actionsCountAfter}`
  );
}

// ─── SCENARIO 3: USER 3 — DESTRUCTIVE FLOW ───────────────────────────────────
// Steps:
//   1. Login with Scenario 1 credentials → refresh token
//   2. Delete the existing series from ctx.seriesId
//   3. Verify deleted series returns 404
//   4. Create a new habit series
//   5. Verify new series is accessible and has a different seriesId

async function runScenario3() {
  console.log('\n=== SCENARIO 3: USER 3 — DESTRUCTIVE FLOW ===');

  if (!ctx.email || !ctx.password || !ctx.seriesId) {
    throw new Error(
      'S3: ctx.email, ctx.password, or ctx.seriesId is missing — Scenario 1 must complete first'
    );
  }

  const deletedSeriesId = ctx.seriesId;

  // ── Step 1: Login ──────────────────────────────────────────────────────────
  let res = await request(
    'POST',
    '/api/auth/login',
    { email: ctx.email, password: ctx.password },
    null
  );

  assertStatus('S3.1_login', res, 200);
  assertString('S3.1_login', res.data, 'token');
  assertString('S3.1_login', res.data, 'userId');

  ctx.token = res.data.token;

  log('S3.1_login', res.latency, `userId=${res.data.userId}`);

  // ── Step 2: Delete existing series ────────────────────────────────────────
  res = await request('DELETE', `/api/habits/series/${deletedSeriesId}`, null, ctx.token);

  assertStatus('S3.2_delete_series', res, 204);

  log('S3.2_delete_series', res.latency, `seriesId=${deletedSeriesId}`);

  // ── Step 2 business validation: series is no longer accessible ─────────────
  res = await request('GET', `/api/habits/series/${deletedSeriesId}`, null, ctx.token);

  assertStatus('S3.2b_verify_series_deleted', res, 404);

  log('S3.2b_verify_series_deleted', res.latency, 'deleted series correctly returns 404');

  // ── Step 3: Create new habit series ───────────────────────────────────────
  res = await request(
    'POST',
    '/api/habits/series',
    {
      language: 'en',
      testData: {
        goal: 'build consistent daily discipline',
        age: '30',
        experience: 'intermediate',
        frequency: 'daily',
        timeAvailable: '30 minutes',
      },
      assistantContext: '',
    },
    ctx.token
  );

  assertStatus('S3.3_create_new_series', res, 201);
  assertString('S3.3_create_new_series', res.data, 'id');
  assertString('S3.3_create_new_series', res.data, 'title');
  assertString('S3.3_create_new_series', res.data, 'description');
  assertArray('S3.3_create_new_series', res.data, 'actions', 3);
  assertString('S3.3_create_new_series', res.data, 'createdAt');

  const newSeriesId = res.data.id;

  assertNotEqual(
    'S3.3_create_new_series',
    newSeriesId,
    deletedSeriesId,
    `New seriesId must differ from deleted seriesId (${deletedSeriesId})`
  );

  log('S3.3_create_new_series', res.latency, `newSeriesId=${newSeriesId}`);

  // ── Step 3 business validation: new series is accessible ──────────────────
  res = await request('GET', `/api/habits/series/${newSeriesId}`, null, ctx.token);

  assertStatus('S3.3b_verify_new_series_exists', res, 200);

  if (res.data.id !== newSeriesId) {
    throw new Error(
      `[S3.3b_verify_new_series_exists] seriesId mismatch: expected ${newSeriesId}, got ${res.data.id}`
    );
  }

  log('S3.3b_verify_new_series_exists', res.latency, 'new series confirmed in backend');

  ctx.seriesId = newSeriesId;
}

// ─── RESULTS REPORTER ────────────────────────────────────────────────────────

function reportResults(results, runStartMs) {
  const duration = Date.now() - runStartMs;
  const passedCount = Object.values(results.scenarios).filter((v) => v === 'passed').length;
  const total = 3;

  console.log('\n─────────────────────────────────────────────────────');
  console.log(`SYNTHETIC RUN | ${new Date().toISOString()}`);
  console.log(`Target:   ${BASE_URL}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Result:   ${passedCount}/${total} scenarios passed`);
  console.log(`  [S1] Full Flow:          ${results.scenarios.s1}`);
  console.log(`  [S2] Existing State:     ${results.scenarios.s2}`);
  console.log(`  [S3] Destructive Flow:   ${results.scenarios.s3}`);
  if (results.failedStep) {
    console.log(`\nFailed at: ${results.failedStep}`);
  }
  console.log('─────────────────────────────────────────────────────\n');
}

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────────────────────

async function main() {
  console.log('\n🔬 Synthetic Monitoring Runner');
  console.log(`Target:  ${BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log(`Started: ${new Date().toISOString()}`);

  const results = {
    scenarios: { s1: 'pending', s2: 'pending', s3: 'pending' },
    failedStep: null,
  };
  const runStart = Date.now();

  try {
    await runScenario1();
    results.scenarios.s1 = 'passed';
  } catch (err) {
    results.scenarios.s1 = 'failed';
    results.failedStep = err.message;
    console.error(`\n✗ SCENARIO 1 FAILED — aborting run\n  ${err.message}`);
    reportResults(results, runStart);
    process.exit(1);
  }

  try {
    await runScenario2();
    results.scenarios.s2 = 'passed';
  } catch (err) {
    results.scenarios.s2 = 'failed';
    results.failedStep = err.message;
    console.error(`\n✗ SCENARIO 2 FAILED — aborting run\n  ${err.message}`);
    reportResults(results, runStart);
    process.exit(1);
  }

  try {
    await runScenario3();
    results.scenarios.s3 = 'passed';
  } catch (err) {
    results.scenarios.s3 = 'failed';
    results.failedStep = err.message;
    console.error(`\n✗ SCENARIO 3 FAILED\n  ${err.message}`);
    reportResults(results, runStart);
    process.exit(1);
  }

  reportResults(results, runStart);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
