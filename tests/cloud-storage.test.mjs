import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { stages } from '../src/full-course.mjs';

for (const cloud of [false, true]) test(`HTTP course and restart persistence: ${cloud ? 'libsql adapter' : 'local sqlite'}`, async () => {
  const data = await mkdtemp(join(tmpdir(), 'nobet-storage-'));
  const port = cloud ? 3198 : 3197, base = `http://127.0.0.1:${port}`;
  const env = { ...process.env, PORT: String(port), DATA_DIR: data, ADMIN_PASSWORD: 'test-only-password', RENDER: '', TURSO_DATABASE_URL: cloud ? `file:${join(data, 'cloud.db').replaceAll('\\', '/')}` : '', TURSO_AUTH_TOKEN: '' };
  let server;
  const start = async () => {
    server = spawn(process.execPath, ['server/index.mjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let errors = ''; server.stderr.on('data', c => errors += c);
    for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/api/health')).ok) return; } catch {} if (server.exitCode !== null) throw new Error(errors); await new Promise(r => setTimeout(r, 50)); }
    throw new Error('Server did not start: ' + errors);
  };
  const stop = async () => { const exited = once(server, 'exit'); server.kill(); await exited; };
  await start();
  try {
    const created = await (await fetch(base + '/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias: 'KalıcıTest' }) })).json();
    assert.ok(created.token); const id = created.session.id;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${created.token}` };
    const act = async (action, body = {}) => { const response = await fetch(`${base}/api/sessions/${id}/${action}`, { method: 'POST', headers, body: JSON.stringify(body) }); assert.ok(response.ok, await response.clone().text()); return response.json(); };
    await act('enter'); await act('observed');
    const concurrent = await Promise.all([act('answer', { choice: 'B' }), fetch(`${base}/api/sessions/${id}/answer`, { method: 'POST', headers, body: JSON.stringify({ choice: 'B' }) })]);
    assert.equal(concurrent[0].score, 10); assert.equal(concurrent[1].status, 409);
    await act('learned'); await act('stop2/start'); await act('stop2/answer', { choice: 'B' }); await act('stop2/learned'); await act('course/next');
    for (let stage = 3; stage <= 10; stage++) { const state = await act('course/act', { value: stages[stage].correct }); assert.equal(state.phase, 'course-learning'); await act('course/next'); }
    await stop(); await start();
    const restored = await (await fetch(`${base}/api/sessions/${id}`, { headers })).json(); assert.equal(restored.phase, 'finished'); assert.equal(restored.score, 100);
    assert.equal((await fetch(`${base}/api/sessions/${id}`)).status, 401);
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: env.ADMIN_PASSWORD }) }); assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0]; const adminHeaders = { Cookie: cookie };
    const results = await (await fetch(base + '/api/admin/results', { headers: adminHeaders })).json(); assert.equal(results.participants[0].score, 100);
    const events = await (await fetch(`${base}/api/admin/results/${id}/events`, { headers: adminHeaders })).json(); assert.ok(events.length > 15);
    const csv = await (await fetch(base + '/api/admin/export', { headers: adminHeaders })).text(); assert.ok(csv.includes('KalıcıTest'));
  } finally { if (server.exitCode === null) await stop(); }
});
