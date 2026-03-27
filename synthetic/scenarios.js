import { request } from './http.js'

export async function scenarioA(user) {
  await request('GET', '/api/user/dashboard', user.token, null)
  await request('GET', '/api/habits/series', user.token, null)
}

export async function scenarioB(user) {
  const result = await request('POST', '/api/habits/series', user.token, {
    language: 'en',
    assistantContext: 'Synthetic test user. Load testing session.',
    testData: {
      goal: 'Build a consistent daily writing habit',
      obstacle: 'Lack of time and distractions at home',
      profession: 'Software engineer',
      previousAttempt: 'Tried journaling but stopped after two weeks',
      motivation: 'Improve technical communication and clarity of thinking',
    },
  })

  if (result.ok && typeof result.body?.id === 'string' && result.body.id.length > 0) {
    await request('GET', `/api/habits/series/${result.body.id}`, user.token, null)
    return result.body.id
  }
  return null
}

export async function scenarioC(user, seriesId) {
  await request('POST', `/api/habits/series/${seriesId}/actions`, user.token, { language: 'en' })
}
