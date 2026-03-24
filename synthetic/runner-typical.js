/**
 * Synthetic Monitoring Runner — Typical
 *
 * Simulates a realistic multi-session user lifecycle: onboarding, two return
 * sessions separated by 5-minute delays.
 *
 * Execution: node synthetic/runner-typical.js (from project root)
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

const WAIT_BETWEEN_CYCLES_MS = 5 * 60 * 1000; // 5 minutes

// ─── SHARED CONTEXT ──────────────────────────────────────────────────────────

const ctx = {
  email: null,
  password: null,
  token: null,
  userId: null,
  seriesId: null,
  dashboardAfterOnboarding: null,
};

// ─── HTTP CLIENT ─────────────────────────────────────────────────────────────

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

function log(step, latency, note) {
  const ts = new Date().toISOString();
  const noteStr = note ? ` | ${note}` : '';
  console.log(`  [${ts}] ✓ ${step} | ${latency}ms${noteStr}`);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ─── SERIES BODY ─────────────────────────────────────────────────────────────

const SERIES_BODY = {
  language: 'en',
  testData: {
    goal: 'build consistent daily habits',
    age: '28',
    experience: 'beginner',
    frequency: 'daily',
    timeAvailable: '15 minutes',
  },
  assistantContext: '',
};

// ─── SCENARIO 1: ONBOARDING ──────────────────────────────────────────────────

async function runScenario1() {
  console.log('\n=== SCENARIO 1: Onboarding ===');

  const email = `synth-typical-${Date.now()}@test.arvi`;
  const password = 'SyntheticRunner1!';

  // Step 1.1: Register
  let res = await request('POST', '/api/auth/register', { email, password }, null);

  assertStatus('S1.1_register', res, 201);
  assertString('S1.1_register', res.data, 'token');
  assertString('S1.1_register', res.data?.user, 'id');

  ctx.email = email;
  ctx.password = password;
  ctx.token = res.data.token;
  ctx.userId = res.data.user.id;

  log('S1.1_register', res.latency, `userId=${ctx.userId} email=${email}`);

  // Step 1.2: Create series
  res = await request('POST', '/api/habits/series', SERIES_BODY, ctx.token);

  assertStatus('S1.2_create_series', res, 201);
  assertString('S1.2_create_series', res.data, 'id');
  assertString('S1.2_create_series', res.data, 'title');
  assertString('S1.2_create_series', res.data, 'description');
  assertArray('S1.2_create_series', res.data, 'actions', 3);

  ctx.seriesId = res.data.id;

  log('S1.2_create_series', res.latency, `seriesId=${ctx.seriesId} actions=${res.data.actions.length}`);

  // Step 1.3: Create action 1
  res = await request('POST', `/api/habits/series/${ctx.seriesId}/actions`, { language: 'en' }, ctx.token);

  assertStatus('S1.3_create_action_1', res, 201);
  assertString('S1.3_create_action_1', res.data, 'id');
  assertString('S1.3_create_action_1', res.data, 'name');
  assertString('S1.3_create_action_1', res.data, 'description');
  assertEnum('S1.3_create_action_1', res.data.difficulty, 'difficulty', ['low', 'medium', 'high']);

  log('S1.3_create_action_1', res.latency, 'action 1 created');

  // Step 1.4: Create action 2
  res = await request('POST', `/api/habits/series/${ctx.seriesId}/actions`, { language: 'en' }, ctx.token);

  assertStatus('S1.4_create_action_2', res, 201);
  assertString('S1.4_create_action_2', res.data, 'id');
  assertString('S1.4_create_action_2', res.data, 'name');
  assertString('S1.4_create_action_2', res.data, 'description');
  assertEnum('S1.4_create_action_2', res.data.difficulty, 'difficulty', ['low', 'medium', 'high']);

  log('S1.4_create_action_2', res.latency, 'action 2 created');

  // Step 1.5: Dashboard snapshot
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S1.5_dashboard', res, 200);
  if (res.data.profile.plan !== 'trial') {
    throw new Error(`[S1.5_dashboard] Expected plan='trial', got '${res.data.profile.plan}'`);
  }
  if (res.data.limits.activeSeriesCount !== 1) {
    throw new Error(`[S1.5_dashboard] Expected activeSeriesCount=1, got ${res.data.limits.activeSeriesCount}`);
  }
  if (typeof res.data.limits.monthlyActionsRemaining !== 'number' || res.data.limits.monthlyActionsRemaining <= 0) {
    throw new Error(`[S1.5_dashboard] Expected monthlyActionsRemaining > 0, got ${res.data.limits.monthlyActionsRemaining}`);
  }

  ctx.dashboardAfterOnboarding = res.data.limits;

  log('S1.5_dashboard', res.latency, `activeSeriesCount=${res.data.limits.activeSeriesCount} monthlyActionsRemaining=${res.data.limits.monthlyActionsRemaining} maxActiveSeries=${res.data.limits.maxActiveSeries}`);

  // Wait between cycles
  console.log(`  [${new Date().toISOString()}] Waiting ${WAIT_BETWEEN_CYCLES_MS / 1000}s before Cycle 1...`);
  await sleep(WAIT_BETWEEN_CYCLES_MS);
  console.log(`  [${new Date().toISOString()}] Wait complete — proceeding to Cycle 1`);
}

// ─── SCENARIO 2: CYCLE 1 (RETURN) ────────────────────────────────────────────

async function runScenario2() {
  console.log('\n=== SCENARIO 2: Cycle 1 (Return) ===');

  // Step 2.1: Login
  let res = await request('POST', '/api/auth/login', { email: ctx.email, password: ctx.password }, null);

  assertStatus('S2.1_login', res, 200);
  assertString('S2.1_login', res.data, 'token');

  ctx.token = res.data.token;

  log('S2.1_login', res.latency, `userId=${res.data.userId}`);

  // Step 2.2: Dashboard — state persisted
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S2.2_dashboard', res, 200);
  if (res.data.limits.activeSeriesCount !== ctx.dashboardAfterOnboarding.activeSeriesCount) {
    throw new Error(
      `[S2.2_dashboard] Expected activeSeriesCount=${ctx.dashboardAfterOnboarding.activeSeriesCount}, got ${res.data.limits.activeSeriesCount}`
    );
  }
  if (res.data.limits.monthlyActionsRemaining !== ctx.dashboardAfterOnboarding.monthlyActionsRemaining) {
    throw new Error(
      `[S2.2_dashboard] Expected monthlyActionsRemaining=${ctx.dashboardAfterOnboarding.monthlyActionsRemaining}, got ${res.data.limits.monthlyActionsRemaining}`
    );
  }

  log('S2.2_dashboard', res.latency, 'state persisted correctly across sessions');

  // Step 2.3: Create action 3
  res = await request('POST', `/api/habits/series/${ctx.seriesId}/actions`, { language: 'en' }, ctx.token);

  assertStatus('S2.3_create_action_3', res, 201);

  log('S2.3_create_action_3', res.latency, 'action 3 created');

  // Step 2.4: Dashboard — actionsRemaining decreased
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S2.4_dashboard', res, 200);
  const before = ctx.dashboardAfterOnboarding.monthlyActionsRemaining;
  const after = res.data.limits.monthlyActionsRemaining;
  if (after >= before) {
    throw new Error(
      `[S2.4_dashboard] Expected monthlyActionsRemaining to decrease. before=${before}, after=${after}`
    );
  }

  log('S2.4_dashboard', res.latency, `actionsRemaining: ${before} → ${after}`);

  // Wait between cycles
  console.log(`  [${new Date().toISOString()}] Waiting ${WAIT_BETWEEN_CYCLES_MS / 1000}s before Cycle 2...`);
  await sleep(WAIT_BETWEEN_CYCLES_MS);
  console.log(`  [${new Date().toISOString()}] Wait complete — proceeding to Cycle 2`);
}

// ─── SCENARIO 3: CYCLE 2 (REORGANIZE) ────────────────────────────────────────

async function runScenario3() {
  console.log('\n=== SCENARIO 3: Cycle 2 (Reorganize) ===');

  // Step 3.1: Login
  let res = await request('POST', '/api/auth/login', { email: ctx.email, password: ctx.password }, null);

  assertStatus('S3.1_login', res, 200);
  assertString('S3.1_login', res.data, 'token');

  ctx.token = res.data.token;

  log('S3.1_login', res.latency, `userId=${res.data.userId}`);

  // Step 3.2: Delete existing series
  const oldSeriesId = ctx.seriesId;
  res = await request('DELETE', `/api/habits/series/${oldSeriesId}`, null, ctx.token);

  assertStatus('S3.2_delete_series', res, 204);
  log('S3.2_delete_series', res.latency, `seriesId=${oldSeriesId} deleted`);

  // Step 3.3: Deleted series returns 404
  res = await request('GET', `/api/habits/series/${oldSeriesId}`, null, ctx.token);

  assertStatus('S3.3_verify_deleted', res, 404);
  log('S3.3_verify_deleted', res.latency, 'deleted series correctly returns 404');

  // Step 3.4: Create new series
  res = await request('POST', '/api/habits/series', SERIES_BODY, ctx.token);

  assertStatus('S3.4_create_series', res, 201);
  assertString('S3.4_create_series', res.data, 'id');

  const newSeriesId = res.data.id;
  assertNotEqual('S3.4_create_series', newSeriesId, oldSeriesId, `New seriesId must differ from deleted seriesId (${oldSeriesId})`);

  ctx.seriesId = newSeriesId;

  log('S3.4_create_series', res.latency, `newSeriesId=${newSeriesId}`);

  // Step 3.5: Dashboard — net activeSeriesCount unchanged (deleted 1, created 1)
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S3.5_dashboard', res, 200);
  if (res.data.limits.activeSeriesCount !== 1) {
    throw new Error(
      `[S3.5_dashboard] Expected activeSeriesCount=1, got ${res.data.limits.activeSeriesCount}`
    );
  }

  log('S3.5_dashboard', res.latency, `activeSeriesCount=${res.data.limits.activeSeriesCount} monthlyActionsRemaining=${res.data.limits.monthlyActionsRemaining}`);
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

async function runCleanup() {
  console.log('\n=== CLEANUP ===');

  if (!ctx.token) {
    console.log('  [CLEANUP] No token — skipping (registration did not complete)');
    return;
  }

  // Step C.1: Delete account
  let res = await request('DELETE', '/api/user/account', null, ctx.token);
  assertStatus('C.1_delete_account', res, 204);
  log('C.1_delete_account', res.latency, 'account deleted');

  // Step C.2: Login must be rejected
  res = await request('POST', '/api/auth/login', { email: ctx.email, password: ctx.password }, null);
  assertStatus('C.2_login_rejected', res, 401);
  log('C.2_login_rejected', res.latency, 'login correctly rejected after account deletion');
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
  console.log(`  [S1] Onboarding:            ${results.scenarios.s1}`);
  console.log(`  [S2] Cycle 1 (Return):      ${results.scenarios.s2}`);
  console.log(`  [S3] Cycle 2 (Reorganize):  ${results.scenarios.s3}`);
  if (results.failedStep) {
    console.log(`\nFailed at: ${results.failedStep}`);
  }
  console.log('─────────────────────────────────────────────────────\n');
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔬 Synthetic Monitoring Runner — Typical');
  console.log(`Target:  ${BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log(`Started: ${new Date().toISOString()}`);

  const results = {
    scenarios: { s1: 'pending', s2: 'pending', s3: 'pending' },
    failedStep: null,
  };
  const runStart = Date.now();
  let exitCode = 0;

  try {
    try {
      await runScenario1();
      results.scenarios.s1 = 'passed';
    } catch (err) {
      results.scenarios.s1 = 'failed';
      results.failedStep = err.message;
      console.error(`\n✗ SCENARIO 1 FAILED — aborting run\n  ${err.message}`);
      exitCode = 1;
      return;
    }

    try {
      await runScenario2();
      results.scenarios.s2 = 'passed';
    } catch (err) {
      results.scenarios.s2 = 'failed';
      results.failedStep = err.message;
      console.error(`\n✗ SCENARIO 2 FAILED — aborting run\n  ${err.message}`);
      exitCode = 1;
      return;
    }

    try {
      await runScenario3();
      results.scenarios.s3 = 'passed';
    } catch (err) {
      results.scenarios.s3 = 'failed';
      results.failedStep = err.message;
      console.error(`\n✗ SCENARIO 3 FAILED\n  ${err.message}`);
      exitCode = 1;
    }
  } finally {
    try {
      await runCleanup();
    } catch (cleanupErr) {
      console.error(`\n✗ CLEANUP FAILED\n  ${cleanupErr.message}`);
    }
    reportResults(results, runStart);
    process.exit(exitCode);
  }
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
