import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1020 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
await page.addInitScript(() => {
  const NativeAudioContext = window.AudioContext;
  window.__audio = { contexts: [], tones: [], gains: [] };
  window.AudioContext = class extends NativeAudioContext {
    constructor(...args) { super(...args); window.__audio.contexts.push(this); }
    createGain() { const node = super.createGain(); window.__audio.gains.push(node); return node; }
    createOscillator() {
      const node = super.createOscillator(); const start = node.start.bind(node);
      node.start = (...args) => { window.__audio.tones.push({ type: node.type, frequency: node.frequency.value }); return start(...args); };
      return node;
    }
  };
});
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.locator('.three-scene canvas').waitFor();
await page.screenshot({ path: 'test-results/01-ready.png', fullPage: true });
assert.equal(await page.locator('.scene-loading').count(), 0, '3D scene initialized');
await page.getByRole('button', { name: 'Simülasyonu başlat' }).click();
await page.getByTestId('choice-observe').click();
await page.getByRole('alert').waitFor();
await page.waitForTimeout(2500);
assert.ok(Number(await page.getByTestId('hr').textContent()) > 120);
assert.ok(Number(await page.getByTestId('co2').textContent()) > 60);
assert.ok(parseFloat(await page.getByTestId('temp').textContent()) > 38);
assert.ok(await page.evaluate(() => window.__audio.contexts[0].state === 'running'), 'Audio context activated by start');
assert.ok(await page.evaluate(() => window.__audio.tones.some(t => t.type === 'triangle' && t.frequency === 980)), 'Critical alarm tones were produced');
await page.screenshot({ path: 'test-results/02-critical.png', fullPage: true });
await page.getByRole('button', { name: 'Duraklat', exact: true }).click();
const frozenTimer = await page.getByTestId('timer').textContent();
const frozenHR = await page.getByTestId('hr').textContent();
await page.waitForTimeout(1300);
assert.equal(await page.getByTestId('timer').textContent(), frozenTimer);
assert.equal(await page.getByTestId('hr').textContent(), frozenHR);
await page.locator('.pause-overlay').getByRole('button', { name: 'Devam et' }).click();
await page.getByRole('button', { name: 'Sesi kapat' }).click();
assert.equal(await page.getByRole('button', { name: 'Sesi aç' }).getAttribute('aria-pressed'), 'false');
await page.getByTestId('choice-escalate').click();
await page.getByTestId('choice-prepare').waitFor({ timeout: 15000 });
assert.ok(Number(await page.getByTestId('hr').textContent()) < 110);
await page.getByTestId('choice-prepare').click();
await page.getByTestId('choice-monitor').waitFor({ timeout: 15000 });
await page.getByTestId('choice-monitor').click();
await page.getByRole('heading', { name: 'Bir karar. Bir fark.' }).waitFor({ timeout: 15000 });
assert.equal(await page.getByTestId('hr').textContent(), '82');
assert.equal(await page.getByTestId('co2').textContent(), '38');
assert.equal(parseFloat(await page.getByTestId('temp').textContent()), 37.2);
await page.screenshot({ path: 'test-results/03-complete.png', fullPage: true });
await page.getByRole('button', { name: 'Yeni vardiya başlat' }).click();
assert.equal(await page.getByTestId('timer').textContent(), '00:00');
await page.getByRole('button', { name: 'Hasta', exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'test-results/04-patient.png', fullPage: true });
await page.getByRole('button', { name: 'Oda', exact: true }).click();
await page.getByRole('button', { name: 'Vaka bilgisi', exact: true }).first().click();
await page.getByRole('heading', { name: 'Beklenmeyen yükseliş' }).waitFor();
await page.getByRole('button', { name: 'Kapat', exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'test-results/05-mobile.png', fullPage: true });
const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
assert.ok(noOverflow, 'Mobile layout does not overflow');
await page.getByRole('button', { name: 'Simülasyonu başlat' }).click();
await page.getByTestId('choice-escalate').click();
await page.getByTestId('choice-prepare').waitFor({ timeout: 15000 });
await page.getByRole('button', { name: 'Yeniden başlat', exact: true }).click();
await page.getByRole('dialog').getByRole('button', { name: 'Yeniden başlat' }).click();
assert.equal(await page.getByTestId('hr').textContent(), '108');
assert.deepEqual(errors, [], 'No browser runtime errors');
console.log(JSON.stringify({ result: 'PASS', checks: ['3D render', 'wrong decision and critical visual alarm', 'rising vitals', 'pause and resume', 'mute toggle', 'three-stage completion after mistake', 'stable final vitals', 'reset', 'camera switching', 'case dialog', 'mobile layout and play', 'no runtime errors'], screenshots: 5 }));
await browser.close();
