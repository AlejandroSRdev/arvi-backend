/**
 * Synthetic Monitoring Runner — Limits
 *
 * Verifies that the system correctly enforces the maxActiveSeries plan limit.
 *
 * Execution: node synthetic/runner-limits.js (from project root)
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

const ctx = {
  email: null,
  password: null,
  token: null,
  userId: null,
  seriesIds: [],
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

// ─── SCENARIO 1: SETUP ───────────────────────────────────────────────────────

async function runScenario1() {
  console.log('\n=== SCENARIO 1: Setup ===');

  const email = `synth-limits-${Date.now()}@test.arvi`;
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

  // Step 1.2: Dashboard initial state
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S1.2_dashboard', res, 200);
  if (res.data.profile.plan !== 'trial') {
    throw new Error(`[S1.2_dashboard] Expected plan='trial', got '${res.data.profile.plan}'`);
  }
  if (res.data.limits.activeSeriesCount !== 0) {
    throw new Error(`[S1.2_dashboard] Expected activeSeriesCount=0, got ${res.data.limits.activeSeriesCount}`);
  }
  if (res.data.limits.maxActiveSeries !== 5) {
    throw new Error(`[S1.2_dashboard] Expected maxActiveSeries=5, got ${res.data.limits.maxActiveSeries}`);
  }

  log('S1.2_dashboard', res.latency, `plan=${res.data.profile.plan} activeSeriesCount=${res.data.limits.activeSeriesCount} maxActiveSeries=${res.data.limits.maxActiveSeries}`);
}

// ─── SCENARIO 2: FILL TO LIMIT ───────────────────────────────────────────────

async function runScenario2() {
  console.log('\n=== SCENARIO 2: Fill to Limit ===');

  for (let i = 1; i <= 5; i++) {
    // Step 2.i.a: Create series
    let res = await request('POST', '/api/habits/series', SERIES_BODY, ctx.token);

    assertStatus(`S2.${i}a_create_series`, res, 201);
    assertString(`S2.${i}a_create_series`, res.data, 'id');

    const seriesId = res.data.id;
    ctx.seriesIds.push(seriesId);

    log(`S2.${i}a_create_series`, res.latency, `series ${i}/5 created, seriesId=${seriesId}`);

    // Step 2.i.b: Dashboard counter
    res = await request('GET', '/api/user/dashboard', null, ctx.token);

    assertStatus(`S2.${i}b_dashboard`, res, 200);
    if (res.data.limits.activeSeriesCount !== i) {
      throw new Error(
        `[S2.${i}b_dashboard] Expected activeSeriesCount=${i}, got ${res.data.limits.activeSeriesCount}`
      );
    }

    log(`S2.${i}b_dashboard`, res.latency, `activeSeriesCount=${res.data.limits.activeSeriesCount}`);
  }
}

// ─── SCENARIO 3: HIT THE WALL ────────────────────────────────────────────────

async function runScenario3() {
  console.log('\n=== SCENARIO 3: Hit the Wall ===');

  // Step 3.1: 6th series — must be rejected with 4xx
  let res = await request('POST', '/api/habits/series', SERIES_BODY, ctx.token);

  if (res.status < 400 || res.status >= 500) {
    throw new Error(
      `[S3.1_series_limit] Expected 4xx status, got ${res.status}. Body: ${JSON.stringify(res.data)}`
    );
  }

  log('S3.1_series_limit', res.latency, 'series creation correctly rejected at limit');

  // Step 3.2: Counter must be unchanged
  res = await request('GET', '/api/user/dashboard', null, ctx.token);

  assertStatus('S3.2_dashboard', res, 200);
  if (res.data.limits.activeSeriesCount !== 5) {
    throw new Error(
      `[S3.2_dashboard] Expected activeSeriesCount=5, got ${res.data.limits.activeSeriesCount}`
    );
  }

  log('S3.2_dashboard', res.latency, 'activeSeriesCount unchanged after rejected attempt');
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

  // Step C.2: Token must be invalidated
  res = await request('GET', '/api/user/dashboard', null, ctx.token);
  assertStatus('C.2_token_invalidated', res, 401);
  log('C.2_token_invalidated', res.latency, 'token correctly invalidated after account deletion');
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
  console.log(`  [S1] Setup:          ${results.scenarios.s1}`);
  console.log(`  [S2] Fill to Limit:  ${results.scenarios.s2}`);
  console.log(`  [S3] Hit the Wall:   ${results.scenarios.s3}`);
  if (results.failedStep) {
    console.log(`\nFailed at: ${results.failedStep}`);
  }
  console.log('─────────────────────────────────────────────────────\n');
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔬 Synthetic Monitoring Runner — Limits');
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
