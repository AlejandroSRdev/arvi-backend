import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { request } from './http.js'
dotenv.config({ path: fileURLToPath(new URL('.env.synthetic', import.meta.url)) })

let TEST_USERS
try {
  const mod = await import('./users.js')
  TEST_USERS = mod.TEST_USERS
} catch (_) {
  console.error('ERROR: synthetic/users.js not found.')
  process.exit(1)
}

const CONCURRENCY_LEVELS = [5, 10, 20]

const BATCHES = CONCURRENCY_LEVELS.map((level, i) => ({
  batchId: `batch_${i + 1}`,
  concurrencyLevel: level,
}))

const MAX_CONCURRENCY = Math.max(...CONCURRENCY_LEVELS)

const TIMEOUT_MS = 90_000
const PAUSE_BETWEEN_BATCHES_MS = 15_000

const SERIES_PAYLOAD = {
  language: 'en',
  assistantContext: 'Load experiment. Synthetic user.',
  testData: {
    goal: 'Build a consistent daily writing habit',
    obstacle: 'Lack of time and distractions at home',
    profession: 'Software engineer',
    previousAttempt: 'Tried journaling but stopped after two weeks',
    motivation: 'Improve technical communication and clarity of thinking',
  },
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function emit(record) {
  process.stdout.write(JSON.stringify(record) + '\n')
}

async function loginAll(users) {
  const authenticated = []
  for (let i = 0; i < users.length; i++) {
    const { email, password } = users[i]
    try {
      const result = await request('POST', '/api/auth/login', null, { email, password })
      if (result.ok) {
        authenticated.push({ email, token: result.body.token })
      } else {
        if (result.status === 0) {
          console.error(`[EXPERIMENT] Login failed for ${email}: NETWORK_ERROR errorCode=${result.errorCode} errorMessage=${result.errorMessage}`)
        } else {
          console.error(`[EXPERIMENT] Login failed for ${email}: status=${result.status} body=${JSON.stringify(result.body)}`)
        }
      }
    } catch (err) {
      console.error(`[EXPERIMENT] Login error for ${email}:`, err.message)
    }
    if (i < users.length - 1) {
      await delay(100)
    }
  }
  return authenticated
}

async function executeRequest(user, batchId, concurrencyLevel, requestIndex) {
  const ts = new Date().toISOString()

  let result
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })), TIMEOUT_MS)
    )
    result = await Promise.race([
      request('POST', '/api/habits/series', user.token, SERIES_PAYLOAD),
      timeoutPromise,
    ])
  } catch (err) {
    emit({
      event: 'request.result',
      batch_id: batchId,
      concurrency_level: concurrencyLevel,
      request_index: requestIndex,
      ts,
      status: 'failure',
      http_status: 0,
      latency_ms: TIMEOUT_MS,
      cost_usd: null,
      error_code: err.code === 'TIMEOUT' ? 'TIMEOUT' : 'NETWORK_ERROR',
    })
    return
  }

  emit({
    event: 'request.result',
    batch_id: batchId,
    concurrency_level: concurrencyLevel,
    request_index: requestIndex,
    ts,
    status: result.ok ? 'success' : 'failure',
    http_status: result.status,
    latency_ms: result.durationMs,
    cost_usd: result.body?._meta?.cost_usd ?? null,
    error_code: result.ok ? null : (result.status === 0 ? result.errorCode : (result.body?.error ?? `HTTP_${result.status}`)),
  })
}

async function runBatch(users, batchId, concurrencyLevel) {
  console.error(`[EXPERIMENT] Starting ${batchId} — ${concurrencyLevel} concurrent requests`)

  const selected = users.slice(0, concurrencyLevel)
  const tasks = selected.map((user, i) => executeRequest(user, batchId, concurrencyLevel, i))
  await Promise.all(tasks)

  console.error(`[EXPERIMENT] ${batchId} complete`)
}

async function main() {
  if (TEST_USERS.length < MAX_CONCURRENCY) {
    console.error(`ERROR: Need ${MAX_CONCURRENCY} users, found ${TEST_USERS.length}`)
    process.exit(1)
  }

  console.error(`[EXPERIMENT] Base URL: ${process.env.SYNTHETIC_BASE_URL || 'http://localhost:3000'}`)
  console.error(`[EXPERIMENT] Logging in ${MAX_CONCURRENCY} users...`)
  const authenticated = await loginAll(TEST_USERS.slice(0, MAX_CONCURRENCY))

  if (authenticated.length < MAX_CONCURRENCY) {
    console.error(`ERROR: Only ${authenticated.length}/${MAX_CONCURRENCY} users authenticated. Aborting.`)
    process.exit(1)
  }
  console.error(`[EXPERIMENT] ${authenticated.length} users authenticated`)

  console.error('[EXPERIMENT] Warm-up request...')
  const warmup = await request('POST', '/api/habits/series', authenticated[0].token, SERIES_PAYLOAD)
  if (!warmup.ok) {
    if (warmup.status === 0) {
      console.error(`ERROR: Warm-up failed. NETWORK_ERROR errorCode=${warmup.errorCode} errorMessage=${warmup.errorMessage}`)
    } else {
      console.error(`ERROR: Warm-up failed. status=${warmup.status} body=${JSON.stringify(warmup.body)}`)
    }
    process.exit(1)
  }
  console.error('[EXPERIMENT] Warm-up OK')

  for (let i = 0; i < BATCHES.length; i++) {
    const { batchId, concurrencyLevel } = BATCHES[i]
    await runBatch(authenticated, batchId, concurrencyLevel)
    if (i < BATCHES.length - 1) {
      console.error(`[EXPERIMENT] Pausing ${PAUSE_BETWEEN_BATCHES_MS / 1000}s before next batch...`)
      await delay(PAUSE_BETWEEN_BATCHES_MS)
    }
  }

  console.error('[EXPERIMENT] Done')
}

main().catch(err => { console.error(err); process.exit(1) })
