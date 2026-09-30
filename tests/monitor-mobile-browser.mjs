import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const base = process.env.TEST_BASE || 'http://127.0.0.1:3003';
let token = '', id = '';
async function post(path, body = {}) { const r = await fetch(`${base}/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }); const d = await r.json(); assert.ok(r.ok, JSON.stringify(d)); return d; }
const reg = await post('/sessions', { alias: `Monitor${Date.now()}`.slice(0, 24) }); token = reg.token; id = reg.session.id; const path = `/sessions/${id}`;
await post(`${path}/enter`); await post(`${path}/observed`); await post(`${path}/answer`, { choice: 'B' }); await post(`${path}/learned`); await post(`${path}/stop2/start`); await post(`${path}/stop2/answer`, { choice: 'B' }); await post(`${path}/stop2/learned`); await post(`${path}/course/next`); await post(`${path}/course/act`, { value: 1 }); await post(`${path}/course/next`);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.evaluate(({ id, token }) => localStorage.setItem('nobet-mh-participant-v2', JSON.stringify({ id, token })), { id, token }); await page.reload();
  await page.locator('.stage-visual-4').waitFor();
  await page.getByText('KH 121 · ETCO₂ 58 · KAS TONUSU ↑').waitFor({ timeout: 12000 });
  const visual = await page.locator('.stage-visual-4').boundingBox(); const question = await page.locator('.mobile-question').boundingBox(); assert.ok(visual && question && visual.y < question.y);
  await page.locator('.mobile-choices button').first().click();
  await page.getByText('60 saniye geçti: KH 132/dk').waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await page.locator('.mobile-choices button').nth(1).click();
  await page.getByText('DOĞRU KARAR · 4. KAPI AÇILDI').waitFor();
  assert.deepEqual(errors, []);
  console.log('Mobile monitor timeline, worsening, automatic hint, correct transition OK');
} finally { await browser.close(); }
