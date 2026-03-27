TASK: Implement synthetic monitoring runner for arvi-backend

---

PURPOSE

Implement a synthetic load testing runner that:
1. Seeds test users with PRO plan directly into Firestore (bypassing HTTP layer)
2. Authenticates those users via the backend's login endpoint
3. Executes three realistic load scenarios: read loop, AI series creation, AI action creation
4. Logs each request as a JSON line to stdout for operational analysis

This enables controlled traffic generation to observe backend behavior in Grafana under
simulated concurrent load without manual steps.

---

WORKING DIRECTORY

All new files must be created inside the existing synthetic/ folder at the root of the repo.

The synthetic/ folder already contains:
  synthetic/runner.js
  synthetic/runner-limits.js
  synthetic/runner-typical.js
  synthetic/.env.synthetic

DO NOT modify, rename, delete, or touch any of those existing files.
Only create the new files listed in FILES below.

---

SCOPE

INCLUDED:
- Create all files under synthetic/ as specified below
- Modify .gitignore to add one line: synthetic/users.js

EXCLUDED:
- No changes to any production code (server.js, use cases, controllers, routes,
  middlewares, repositories, domain, errors)
- No new npm packages — only use existing dependencies (firebase-admin, dotenv)
  and Node.js built-ins (node:crypto, fetch)
- No test framework or test runner integration
- No CI/CD integration
- No changes to package.json
- No TypeScript

---

FILES

CREATE (all inside synthetic/):
  synthetic/seed.js
  synthetic/config.js
  synthetic/users.example.js
  synthetic/http.js
  synthetic/scenarios.js
  synthetic/runner-concurrent.js

MODIFY:
  .gitignore  →  append the line: synthetic/users.js

DO NOT CREATE:
  synthetic/users.js  (the user creates it manually from users.example.js)

DO NOT MODIFY:
  synthetic/runner.js
  synthetic/runner-limits.js
  synthetic/runner-typical.js
  synthetic/.env.synthetic
  Any file outside synthetic/ except .gitignore

---

SYSTEM CONTEXT

Authentication:
- The backend uses JWT signed with process.env.JWT_SECRET (not Firebase Auth)
- Login endpoint: POST /api/auth/login  body: { email, password }
- Successful response: { token: string, userId: string }
- Token expiry: 1 hour
- authRateLimiter is active on /api/auth/login — must delay 2000ms between sequential logins

Password hashing:
- Algorithm: Node.js crypto.scrypt, 64-byte key, 16-byte random salt
- Output format: "salt:hash" where both are hex strings
- Exact implementation in 03infrastructure/security/PasswordHasher.js:
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 64, (err, dk) => resolve(`${salt}:${dk.toString('hex')}`))

Firebase Admin:
- Already a direct dependency: firebase-admin
- Environment variables required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- FIREBASE_PRIVATE_KEY contains literal \n characters — must replace:
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
- Firestore collection for users: 'users'

PRO plan limits (from 01domain/value_objects/user/Limits.js):
- maxActiveSeries: 20
- monthlyActionsMax: 100
- monthlyActionsRemaining: 100

Rate limiters:
- generalRateLimiter on /api/habits and /api/user routes: 100 req/min — safe for test load
- authRateLimiter on /api/auth/login: enforce 2000ms delay between sequential calls

Fetch:
- Native fetch is available in Node >= 18 (package.json engines.node >= 18)
- Do NOT import node-fetch

ES Modules:
- package.json has "type": "module" — all files use import/export syntax
- No require()

testData payload for habit series creation (from CreativeHabitSeriesPrompt.js):
- The prompt consumes testData as key-value pairs serialized as "key: value; key2: value2"
- Any realistic key-value map works — use the sample defined in scenarios.js requirements below

---

REQUIREMENTS

--- 1. synthetic/seed.js ---

Purpose: creates or resets test users with PRO plan directly in Firestore.

Must:
- Start with: import 'dotenv/config'
- Initialize Firebase Admin SDK directly (NOT via FirebaseConfig.js — that file uses
  lazy proxies unsuitable for standalone scripts):
    import admin from 'firebase-admin'
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
    const db = admin.firestore()
- Define TEST_USERS array at the top with the same emails/passwords as users.example.js:
    const TEST_USERS = [
      { email: 'test-pro-1@arvi.test', password: 'SyntheticTest1!' },
      { email: 'test-pro-2@arvi.test', password: 'SyntheticTest1!' },
      { email: 'test-pro-3@arvi.test', password: 'SyntheticTest1!' },
    ]
- For each test user, hash the password using scrypt exactly as PasswordHasher.js does:
    import { scrypt, randomBytes } from 'node:crypto'
    function hashPassword(password) {
      return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString('hex')
        scrypt(password, salt, 64, (err, dk) => {
          if (err) reject(err)
          else resolve(`${salt}:${dk.toString('hex')}`)
        })
      })
    }
- For each user:
    a. Query Firestore: db.collection('users').where('email', '==', email).limit(1).get()
    b. If document found: use existing document ID, call doc.ref.update() with the fields below
    c. If not found: generate new ID with crypto.randomUUID(), call db.collection('users').doc(id).set()
- Fields to write in both cases (set or update):
    email:                     <email>
    password:                  <hashed password>
    plan:                      'pro'
    planStatus:                'ACTIVE'
    planStartedAt:             new Date()
    planExpiresAt:             null
    stripeCustomerId:          null
    stripeSubscriptionId:      null
    subscribedAt:              null
    canceledAt:                null
    trial:
      durationDays:            3
      startedAt:               new Date()
    limits:
      maxActiveSeries:         20
      activeSeriesCount:       0
      monthlyActionsMax:       100
      monthlyActionsRemaining: 100
      monthlyActionsResetAt:   null
- After processing all users, log each: { email, userId, action: 'created' | 'updated' }
- Wrap all logic in async function main() and call main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })

--- 2. synthetic/config.js ---

Must export:
  export const CONFIG = {
    BASE_URL: process.env.SYNTHETIC_BASE_URL || 'http://localhost:3000',
    phases: {
      1: { concurrency: 2,  delayBetweenUsersMs: 1000 },
      2: { concurrency: 5,  delayBetweenUsersMs: 300  },
      3: { concurrency: 10, delayBetweenUsersMs: 100  },
    },
    loginDelayMs:    2000,
    scenarioDelayMs: 500,
  }

--- 3. synthetic/users.example.js ---

Must contain a comment header and the example structure:

  // Copy this file to users.js and set real credentials.
  // users.js is gitignored — never commit it.
  export const TEST_USERS = [
    { email: 'test-pro-1@arvi.test', password: 'SyntheticTest1!' },
    { email: 'test-pro-2@arvi.test', password: 'SyntheticTest1!' },
    { email: 'test-pro-3@arvi.test', password: 'SyntheticTest1!' },
  ]

--- 4. synthetic/http.js ---

Must export one function: request(method, path, token, body)

Parameters:
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path:   e.g. '/api/user/dashboard'
  token:  JWT string or null
  body:   plain object or null

Behavior:
- Import CONFIG from './config.js'
- Full URL: CONFIG.BASE_URL + path
- Headers:
    'Content-Type': 'application/json'
    'Authorization': `Bearer ${token}` (only if token is not null)
- Serialize body with JSON.stringify if body is not null
- Record startMs = Date.now() before calling fetch
- Record durationMs = Date.now() - startMs after response
- Parse response JSON best-effort: try JSON.parse, catch → body = null
- On network error (fetch throws):
    return { status: 0, ok: false, body: null, durationMs }
- On success (any HTTP status): return { status, ok: response.ok, body, durationMs }
- Never throw — always return the result object
- No console.log inside this function — http.js is a silent wrapper

--- 5. synthetic/scenarios.js ---

Must export three async functions.

Import request from './http.js'.

scenarioA(user):
  user: { email, userId, token }
  Steps:
    1. await request('GET', '/api/user/dashboard', user.token, null)
    2. await request('GET', '/api/habits/series', user.token, null)
  Returns: void

scenarioB(user):
  user: { email, userId, token }
  Steps:
    1. const result = await request('POST', '/api/habits/series', user.token, {
         language: 'en',
         assistantContext: 'Synthetic test user. Load testing session.',
         testData: {
           goal: 'Build a consistent daily writing habit',
           obstacle: 'Lack of time and distractions at home',
           profession: 'Software engineer',
           previousAttempt: 'Tried journaling but stopped after two weeks',
           motivation: 'Improve technical communication and clarity of thinking'
         }
       })
    2. If result.ok and result.body?.id is a non-empty string:
         await request('GET', `/api/habits/series/${result.body.id}`, user.token, null)
         return result.body.id
    3. Otherwise: return null
  Returns: string (seriesId) | null

scenarioC(user, seriesId):
  user: { email, userId, token }
  seriesId: string
  Steps:
    1. await request('POST', `/api/habits/series/${seriesId}/actions`, user.token, { language: 'en' })
  Returns: void

--- 6. synthetic/runner-concurrent.js ---

Entry point. Accepts phase number as first CLI argument.
Usage: node synthetic/runner-concurrent.js <phase>
Default phase if not provided: 1

Must:
- Start with: import 'dotenv/config'
- Import: CONFIG from './config.js', scenarioA/B/C from './scenarios.js', request from './http.js'
- Import TEST_USERS from './users.js' — if this import fails (file not found), print:
    "ERROR: synthetic/users.js not found. Copy users.example.js and fill credentials."
  and exit(1)
- Read phase from process.argv[2], parse as integer, default 1
- If phase not in [1, 2, 3]: print error and exit(1)
- const phaseConfig = CONFIG.phases[phase]
- const usersForPhase = TEST_USERS.slice(0, phaseConfig.concurrency)

LOGIN PHASE (sequential):
  const authenticatedUsers = []
  For each user in usersForPhase:
    const result = await request('POST', '/api/auth/login', null, { email, password })
    if result.ok and result.body?.token:
      authenticatedUsers.push({ email, userId: result.body.userId, token: result.body.token })
      console.log(`[LOGIN] OK: ${email}`)
    else:
      console.log(`[LOGIN] FAILED: ${email} status=${result.status}`)
    if not the last user: await delay(CONFIG.loginDelayMs)
  If authenticatedUsers.length === 0: print error and exit(1)
  console.log(`[RUNNER] Phase ${phase} — ${authenticatedUsers.length} users authenticated`)

STAGGER HELPER (internal):
  function runStaggered(users, fn, delayMs) {
    const promises = users.map((user, i) =>
      new Promise(resolve => setTimeout(() => resolve(fn(user)), i * delayMs))
    )
    return Promise.allSettled(promises)
  }

SCENARIO PHASE:
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

  if (seriesIds.length > 0):
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
  else:
    console.log('[RUNNER] Round 3 skipped — no series created in Round 2')

  console.log('[RUNNER] Done')

printSummary(label, results):
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - succeeded
  console.log(`[SCENARIO ${label}] succeeded=${succeeded} failed=${failed}`)

delay helper:
  function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

---

NON-GOALS

- Do not retry failed requests
- Do not delete or clean up test users after the run
- Do not add --help or argument parsing beyond process.argv[2]
- Do not add any metrics instrumentation to the runner itself
- Do not catch or suppress errors in scenario functions — let them surface in allSettled
- Do not add comments or JSDoc beyond what is necessary to understand the code

---

CONSTRAINTS

- All files use ES module syntax — no require(), no CommonJS
- No top-level await anywhere — wrap in async main() where needed (seed.js)
- Do not import from FirebaseConfig.js or any production infrastructure file
- Do not hardcode JWT_SECRET — tokens are obtained via HTTP login
- users.js is NOT created by the implementer
- seed.js TEST_USERS array must match the emails and passwords in users.example.js exactly

---

DELIVERABLES

Produce in order:
1. synthetic/seed.js
2. synthetic/config.js
3. synthetic/users.example.js
4. synthetic/http.js
5. synthetic/scenarios.js
6. synthetic/runner-concurrent.js
7. .gitignore (modified — append synthetic/users.js)

After files, provide three lines:
  Seed:    node synthetic/seed.js
  Phase 1: node synthetic/runner-concurrent.js 1
  Phase 2: node synthetic/runner-concurrent.js 2
  Phase 3: node synthetic/runner-concurrent.js 3
And one sentence per command explaining what to verify in the output.
