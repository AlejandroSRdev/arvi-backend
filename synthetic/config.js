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
