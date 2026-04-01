import { CONFIG } from './config.js'

export async function request(method, path, token, body) {
  const url = CONFIG.BASE_URL + path
  const headers = { 'Content-Type': 'application/json', 'x-internal-test': 'true' }
  if (token !== null) headers['Authorization'] = `Bearer ${token}`

  const init = { method, headers }
  if (body !== null) init.body = JSON.stringify(body)

  const startMs = Date.now()
  try {
    const response = await fetch(url, init)
    const durationMs = Date.now() - startMs

    let parsedBody = null
    try {
      const text = await response.text()
      parsedBody = JSON.parse(text)
    } catch (_) {}

    return { status: response.status, ok: response.ok, body: parsedBody, durationMs, errorCode: null, errorMessage: null }
  } catch (err) {
    const durationMs = Date.now() - startMs
    return { status: 0, ok: false, body: null, durationMs, errorCode: err.code ?? 'NETWORK_ERROR', errorMessage: err.message }
  }
}
