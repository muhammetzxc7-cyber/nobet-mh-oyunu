import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:3003';
let token = '';
let id = '';
async function post(path, body = {}) {
  const res = await fetch(`${base}/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  const data = await res.json(); assert.ok(res.ok, JSON.stringify(data)); return data;
}
const registration = await post('/sessions', { alias: `Visual${Date.now()}`.slice(0, 24) });
({ token } = registration); id = registration.session.id;
const path = `/sessions/${id}`;
await post(`${path}/enter`); await post(`${path}/observed`); await post(`${path}/answer`, { choice: 'B' }); await post(`${path}/learned`);
await post(`${path}/stop2/start`);
await post(`${path}/stop2/answer`, { choice: 'B' });
await post(`${path}/stop2/learned`); await post(`${path}/course/next`);
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 950 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.evaluate(({ id, token }) => localStorage.setItem('nobet-mh-participant-v2', JSON.stringify({ id, token })), { id, token }); await page.reload();
  await page.getByRole('heading', { name: 'Risk yalnızca ameliyathanede mi?' }).waitFor();
  await page.locator('.mobile-choices button').first().click();
  await page.getByText('Yanlış karar · İpucu açıldı').waitFor();
  await page.locator('.mobile-choices button').nth(1).click();
  await page.getByRole('button', { name: 'YOL AÇILDI · DEVAM ET' }).click();
  await page.getByRole('heading', { name: 'Monitörde değişiklikler başladı' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Browser stage 3 → 4 and wrong path OK');
} finally { await browser.close(); }
