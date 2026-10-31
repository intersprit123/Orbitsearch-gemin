import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let child;
let baseUrl;
let dataDir;

before(async () => {
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => probe.close(resolve));
  dataDir = mkdtempSync(join(tmpdir(), 'orbit-search-test-'));
  baseUrl = 'http://127.0.0.1:' + port;
  child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), ORBIT_ADMIN_TOKEN: '', ORBIT_ALLOWED_ORIGINS: '', ORBIT_DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let startupError = '';
  child.stderr.on('data', chunk => { startupError += chunk.toString(); });
  child.stdout.on('data', chunk => { startupError += chunk.toString(); });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Orbit server exited early: ' + startupError);
    try { const response = await fetch(baseUrl + '/api/v1/health'); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error('Orbit server did not become ready: ' + startupError);
});

after(() => {
  if (child && child.exitCode === null) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('health endpoint reports version and uptime', async () => {
  const response = await fetch(baseUrl + '/api/v1/health');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.version, '4.0.0');
  assert.equal(typeof data.uptimeSeconds, 'number');
});

test('search rejects empty queries', async () => {
  const response = await fetch(baseUrl + '/api/v1/search');
  const data = await response.json();
  assert.equal(response.status, 400);
  assert.equal(data.error, 'Invalid query');
});

test('search rejects unknown categories', async () => {
  const response = await fetch(baseUrl + '/api/v1/search?q=hello&category=private');
  assert.equal(response.status, 400);
});

test('key administration is disabled without a configured admin secret', async () => {
  const response = await fetch(baseUrl + '/api/v1/keys');
  const data = await response.json();
  assert.equal(response.status, 503);
  assert.equal(data.error, 'Admin API disabled');
});

test('billing checkout never pretends to take payment', async () => {
  const response = await fetch(baseUrl + '/api/v1/billing/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan: 'pro' }) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'Billing unavailable');
});

test('stats do not claim a local index exists', async () => {
  const response = await fetch(baseUrl + '/api/stats');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.stats_available, false);
  assert.equal(data.indexed_pages, null);
});
