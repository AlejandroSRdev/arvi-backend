import dotenv from 'dotenv'
dotenv.config({ path: new URL('.env.synthetic', import.meta.url).pathname })
import { CONFIG } from './config.js'
import { scenarioA, scenarioB, scenarioC } from './scenarios.js'
import { request } from './http.js'

let TEST_USERS
try {
  const mod = await import('./users.js')
  TEST_USERS = mod.TEST_USERS
} catch (_) {
  console.error('ERROR: synthetic/users.js not found. Copy users.example.js and fill credentials.')
  process.exit(1)
}

const phase = parseInt(process.argv[2], 10) || 1
if (![1, 2, 3].includes(phase)) {
  console.error(`ERROR: Invalid phase "${process.argv[2]}". Must be 1, 2, or 3.`)
  process.exit(1)
}

const phaseConfig = CONFIG.phases[phase]
const usersForPhase = TEST_USERS.slice(0, phaseConfig.concurrency)

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function runStaggered(users, fn, delayMs) {
  const promises = users.map((user, i) =>
    new Promise(resolve => setTimeout(() => resolve(fn(user)), i * delayMs))
  )
  return Promise.allSettled(promises)
}

function printSummary(label, results) {
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - succeeded
  console.log(`[SCENARIO ${label}] succeeded=${succeeded} failed=${failed}`)
}

const authenticatedUsers = []
for (let i = 0; i < usersForPhase.length; i++) {
  const { email, password } = usersForPhase[i]
  const result = await request('POST', '/api/auth/login', null, { email, password })
  if (result.ok && result.body?.token) {
    authenticatedUsers.push({ email, userId: result.body.userId, token: result.body.token })
    console.log(`[LOGIN] OK: ${email}`)
  } else {
    console.log(`[LOGIN] FAILED: ${email} status=${result.status}`)
  }
  if (i < usersForPhase.length - 1) await delay(CONFIG.loginDelayMs)
}

if (authenticatedUsers.length === 0) {
  console.error('ERROR: No users authenticated. Aborting.')
  process.exit(1)
}
console.log(`[RUNNER] Phase ${phase} — ${authenticatedUsers.length} users authenticated`)

console.log('[RUNNER] Round 1 — Scenario A (read loop)')
const resultsA = await runStaggered(authenticatedUsers, scenarioA, phaseConfig.delayBetweenUsersMs)
printSummary('A', resultsA)

console.log('[RUNNER] Round 2 — Scenario B (AI series creation)')
const seriesResults = await runStaggered(authenticatedUsers, scenarioB, phaseConfig.delayBetweenUsersMs)
const seriesIds = seriesResults
  .map(r => r.status === 'fulfilled' ? r.value : null)
  .filter(id => id !== null)
printSummary('B', seriesResults)
console.log(`[RUNNER] Series created: ${seriesIds.length}`)

if (seriesIds.length > 0) {
  console.log('[RUNNER] Round 3 — Scenario C (AI action creation)')
  const usersWithSeries = authenticatedUsers
    .slice(0, seriesIds.length)
    .map((user, i) => ({ user, seriesId: seriesIds[i] }))
  const resultsC = await Promise.allSettled(
    usersWithSeries.map(({ user, seriesId }, i) =>
      new Promise(resolve =>
        setTimeout(() => resolve(scenarioC(user, seriesId)), i * phaseConfig.delayBetweenUsersMs)
      )
    )
  )
  printSummary('C', resultsC)
} else {
  console.log('[RUNNER] Round 3 skipped — no series created in Round 2')
}

console.log('[RUNNER] Done')
