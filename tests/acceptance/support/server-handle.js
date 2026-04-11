/**
 * Boots the real server as a subprocess with ARVI_TEST_MODE=true, on a random free port.
 * Shared across all scenarios in a Cucumber run (single boot, reset between scenarios).
 *
 * Deliberately has NO imports from the application source tree — the test harness
 * talks to the server purely over HTTP so the same feature files can later exercise
 * a rewritten implementation in any language.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealth(baseUrl, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Server did not become healthy at ${baseUrl} within ${timeoutMs}ms: ${lastErr?.message ?? 'unknown'}`
  );
}

let serverProcess = null;
let baseUrl = null;

export async function startServer() {
  if (baseUrl) return baseUrl;

  const port = await findFreePort();
  serverProcess = spawn('node', ['server.js'], {
    env: {
      ...process.env,
      ARVI_TEST_MODE: 'true',
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (chunk) => {
    if (process.env.ACCEPTANCE_VERBOSE) process.stdout.write(`[server] ${chunk}`);
  });
  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[server:err] ${chunk}`);
  });

  baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl);
  return baseUrl;
}

export async function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill('SIGTERM');
  serverProcess = null;
  baseUrl = null;
}

export function getBaseUrl() {
  if (!baseUrl) throw new Error('Server not started — call startServer() first');
  return baseUrl;
}

export async function resetServerState() {
  const res = await fetch(`${getBaseUrl()}/__test__/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}
