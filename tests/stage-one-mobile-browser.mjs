import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const base = process.env.TEST_BASE || 'http://127.0.0.1:3003';
const response = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias: `MobileOne${Date.now()}`.slice(0, 24) }) });
assert.ok(response.ok); const { session, token } = await response.json();
const post = async action => { const r = await fetch(`${base}/api/sessions/${session.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{}' }); assert.ok(r.ok); };
await post('enter'); await post('observed');
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.evaluate(({ id, token }) => localStorage.setItem('nobet-mh-participant-v2', JSON.stringify({ id, token })), { id: session.id, token }); await page.reload();
  await page.locator('.anamnesis-overlay').waitFor(); await page.locator('.three-scene canvas').waitFor();
  const scene = await page.locator('.clinical-scene').boundingBox(); const monitor = await page.locator('.clinical-monitor').boundingBox(); const question = await page.locator('.question-card').boundingBox();
  assert.ok(scene && monitor && question && scene.y < monitor.y && monitor.y < question.y);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await page.getByTestId('answer-A').click();
  await page.getByText('İpucu açıldı').first().waitFor();
  await page.getByRole('button', { name: 'TEKRAR DEĞERLENDİR' }).click();
  await page.getByTestId('answer-B').click();
  await page.getByRole('heading', { name: 'MALİGN HİPERTERMİ NEDİR?' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Mobile stop 1 scene, monitor, question, automatic hint OK');
} finally { await browser.close(); }

