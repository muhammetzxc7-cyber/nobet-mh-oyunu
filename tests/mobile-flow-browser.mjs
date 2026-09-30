import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = process.env.TEST_BASE || 'http://127.0.0.1:3003';
let token = '', id = '';
async function post(path, body = {}) { const r = await fetch(`${base}/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }); const data = await r.json(); assert.ok(r.ok, JSON.stringify(data)); return data; }
const reg = await post('/sessions', { alias: `Mobile${Date.now()}`.slice(0, 24) }); token = reg.token; id = reg.session.id; const path = `/sessions/${id}`;
await post(`${path}/enter`); await post(`${path}/observed`); await post(`${path}/answer`, { choice: 'B' }); await post(`${path}/learned`); await post(`${path}/stop2/start`);
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.evaluate(({ id, token }) => localStorage.setItem('nobet-mh-participant-v2', JSON.stringify({ id, token })), { id, token }); await page.reload();
  await page.locator('.stop-two-room').waitFor();
  const scene = await page.locator('.stop-two-room').boundingBox(); const question = await page.locator('.mobile-question').boundingBox();
  assert.ok(scene && question && scene.y < question.y, 'mobile scene is above question');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow on stop 2');
  await page.locator('.mobile-choices button').first().click();
  await page.getByText('Yanlış karar · İpucu açıldı').waitFor();
  await page.locator('.mobile-choices button').nth(1).click();
  await page.getByText('DOĞRU KARAR · 2. KAPI AÇILDI').waitFor();
  await mkdir('test-results/mobile', { recursive: true }); await page.screenshot({ path: 'test-results/mobile/stop-2.png', fullPage: true });
  await page.getByRole('button', { name: /YOL AÇILDI/ }).click();
  await page.getByRole('button', { name: '3. durağa geç' }).click();
  await page.locator('.stage-visual-3').waitFor();
  const scene3 = await page.locator('.stage-visual-3').boundingBox(); const question3 = await page.locator('.mobile-question').boundingBox();
  assert.ok(scene3 && question3 && scene3.y < question3.y, 'mobile scene is above question at stop 3');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow on stop 3');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'test-results/mobile/stop-3.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Mobile stop 2 → 3, automatic hint, vertical layout OK');
} finally { await browser.close(); }

