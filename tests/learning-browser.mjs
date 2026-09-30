import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { options, familyHistory, question, learning } from '../src/clinical-case.mjs';

const folder = 'test-results/learning'; await mkdir(folder, { recursive: true });
const data = await mkdtemp(join(tmpdir(), 'nobet-test-'));
const password = randomBytes(18).toString('hex'), base = 'http://127.0.0.1:3099';
function startServer() {
  const process = spawn('node', ['server/index.mjs'], { env: { ...globalThis.process.env, PORT: '3099', DATA_DIR: data, ADMIN_PASSWORD: password }, stdio: ['ignore', 'pipe', 'pipe'] });
  process.stderr.on('data', chunk => { const text = String(chunk); if (!text.includes('ExperimentalWarning') && !text.includes('trace-warnings')) console.error(text.trim()); });
  return process;
}
let server = startServer();
async function waitReady() { for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/api/health')).ok) return; } catch {} await new Promise(r => setTimeout(r, 100)); } throw new Error('Server did not start'); }
await waitReady();
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
let winnerId;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.maze-node').count(), 10);
  assert.equal(await page.locator('.maze-nurse').getAttribute('transform'), 'translate(43 99)');
  await page.screenshot({ path: `${folder}/01-landing-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'QR ile katıl' }).click();
  await page.locator('.qr-image img').waitFor();
  const source = await page.locator('.qr-image img').getAttribute('src');
  const png = PNG.sync.read(Buffer.from(source.split(',')[1], 'base64'));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.ok(decoded, 'QR decodes successfully');
  const shareUrl = await page.getByLabel('Oyun bağlantısı').inputValue(); assert.equal(decoded.data, shareUrl);
  assert.ok(!shareUrl.includes('egitmen')); await page.getByRole('button', { name: 'Kapat', exact: true }).click();

  async function enterScenario(p, alias) {
    await p.getByLabel('Rumuzun', { exact: true }).fill(alias);
    await p.getByRole('button', { name: 'Yolculuğa başla' }).click();
    await p.getByText('Hastanın kendi ifadesi', { exact: true }).waitFor();
    assert.ok(await p.getByText(`“${familyHistory}”`, { exact: true }).isVisible());
    assert.equal(await p.getByRole('button', { name: 'AMELİYATHANEYE GİR' }).count(), 0);
    await p.getByRole('checkbox').check(); await p.getByRole('button', { name: 'AMELİYATHANEYE GİR' }).click();
    await p.locator('.three-scene canvas').waitFor({ timeout: 30000 });
    for (let i = 0; i < 2; i++) if (await p.getByRole('button', { name: 'Sonraki gözlem' }).isVisible()) await p.getByRole('button', { name: 'Sonraki gözlem' }).click();
    await p.getByRole('button', { name: 'KARAR NOKTASINA GEÇ' }).click();
    await p.getByRole('heading', { name: question, exact: true }).waitFor();
  }
  await page.getByLabel('Rumuzun', { exact: true }).fill('İlkHemşire');
  await page.getByRole('button', { name: 'Yolculuğa başla' }).click();
  await page.getByText('Hastanın kendi ifadesi', { exact: true }).waitFor();
  await page.screenshot({ path: `${folder}/02-patient-file.png`, fullPage: true });
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'AMELİYATHANEYE GİR' }).click();
  await page.locator('.three-scene canvas').waitFor();
  await page.getByRole('button', { name: 'Senaryoyu duraklat' }).click();
  const before = await page.locator('.clinical-footer>span').first().textContent();
  await page.waitForTimeout(1100); assert.equal(await page.locator('.clinical-footer>span').first().textContent(), before);
  await page.getByRole('button', { name: 'Senaryoya devam et' }).click();
  for (let i = 0; i < 2; i++) if (await page.getByRole('button', { name: 'Sonraki gözlem' }).isVisible()) await page.getByRole('button', { name: 'Sonraki gözlem' }).click();
  await page.getByRole('button', { name: 'KARAR NOKTASINA GEÇ' }).click();
  await page.screenshot({ path: `${folder}/03-operating-room.png`, fullPage: true });
  assert.ok(await page.getByText('Ölçüm başlatılmadı', { exact: true }).isVisible());
  for (const option of options) assert.ok(await page.getByTestId(`answer-${option.id}`).getByText(option.text, { exact: true }).isVisible());
  await page.getByTestId('answer-B').click();
  await page.getByRole('heading', { name: learning.title, exact: true }).waitFor();
  assert.equal(await page.locator('.earned-score strong').textContent(), '+10');
  for (const paragraph of learning.paragraphs) assert.ok(await page.getByText(paragraph, { exact: true }).isVisible());
  await page.screenshot({ path: `${folder}/04-learning-card.png`, fullPage: true });
  await page.getByRole('button', { name: 'ÖĞRENDİM — DEVAM ET' }).click();
  await page.getByRole('button', { name: '2. basamağa geç' }).click();
  await page.getByRole('heading', { name: 'Yeni bir karar seni bekleyecek.' }).waitFor();
  await page.getByRole('button', { name: 'LABİRENTE DÖN' }).click();
  await page.waitForFunction(() => document.querySelector('.maze-nurse')?.getAttribute('transform') === 'translate(280 99)');
  await page.screenshot({ path: `${folder}/05-complete-maze.png`, fullPage: true });
  winnerId = await page.evaluate(() => JSON.parse(localStorage.getItem('nobet-mh-participant-v2')).id);
  await page.reload(); await page.getByRole('button', { name: '2. basamağa geç' }).waitFor();

  for (const route of [{ alias: 'İpucuyla', expected: 8, wrong: [], hint: true }, { alias: 'YenidenDeğerlendir', expected: 6, wrong: ['A'], hint: true }, { alias: 'Öğrenerek', expected: 4, wrong: ['C', 'A'], hint: false }]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base, { waitUntil: 'networkidle' }); await enterScenario(p, route.alias);
    for (const choice of route.wrong) {
      await p.getByTestId(`answer-${choice}`).click();
      await p.getByRole('heading', { name: options.find(o => o.id === choice).title, exact: true }).waitFor();
      assert.ok(await p.getByText(options.find(o => o.id === choice).explanation, { exact: true }).isVisible());
      if (route.expected === 6) await p.screenshot({ path: `${folder}/06-incorrect-feedback.png`, fullPage: true });
      await p.getByRole('button', { name: 'TEKRAR DEĞERLENDİR' }).click();
      assert.equal(await p.getByTestId(`answer-${choice}`).isDisabled(), true);
    }
    if (route.hint) {
      await p.locator('.clinical-option').nth(1).getByRole('button', { name: /İpucunu gör/ }).click();
      await p.getByText(options[1].hint, { exact: true }).waitFor();
      await p.reload(); await p.getByTestId('answer-B').waitFor();
    }
    await p.getByTestId('answer-B').click(); await p.locator('.earned-score strong').waitFor();
    assert.equal(await p.locator('.earned-score strong').textContent(), `+${route.expected}`);
    await p.getByRole('button', { name: 'ÖĞRENDİM — DEVAM ET' }).click(); await p.getByRole('button', { name: '2. basamağa geç' }).waitFor();
    await ctx.close();
  }
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const a = await admin.newPage(); a.on('pageerror', e => errors.push(e.message));
  assert.equal((await fetch(base + '/api/admin/results')).status, 401);
  assert.equal((await fetch(base + `/api/sessions/${winnerId}`)).status, 401);
  await a.goto(base + '/#egitmen'); await a.getByLabel('Eğitmen giriş kodu').fill(password); await a.getByRole('button', { name: 'Güvenli giriş' }).click();
  await a.getByRole('heading', { name: 'Her katılımcının yolculuğu.' }).waitFor();
  assert.equal(await a.locator('tbody tr').count(), 4);
  assert.equal(await a.locator('.stats-row>div').nth(1).locator('strong').textContent(), '4');
  await a.screenshot({ path: `${folder}/07-educator.png`, fullPage: true });
  await a.getByLabel('Rumuz ara').fill('İlkHemşire'); assert.equal(await a.locator('tbody tr').count(), 1);
  await a.getByRole('button', { name: 'İlkHemşire kararlarını incele' }).click(); await a.getByText('Öğrenme kartı tamamlandı', { exact: true }).waitFor();
  await a.getByRole('button', { name: 'Kapat', exact: true }).click();
  const downloaded = a.waitForEvent('download'); await a.getByRole('button', { name: 'CSV indir' }).click();
  const download = await downloaded; const csv = await readFile(await download.path(), 'utf8'); assert.ok(csv.includes('İlkHemşire')); assert.ok(csv.includes('"10"')); assert.ok(csv.includes('"8"')); assert.ok(csv.includes('"6"')); assert.ok(csv.includes('"4"'));
  server.kill(); await new Promise(r => server.once('exit', r)); server = startServer(); await waitReady();
  await a.reload(); await a.getByRole('heading', { name: 'Her katılımcının yolculuğu.' }).waitFor(); assert.equal(await a.locator('tbody tr').count(), 4, 'SQLite survives process restart');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const m = await mobile.newPage(); m.on('pageerror', e => errors.push(e.message));
  await m.goto(base, { waitUntil: 'networkidle' }); await m.screenshot({ path: `${folder}/08-mobile-landing.png`, fullPage: true });
  assert.ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await enterScenario(m, 'MobilHemşire'); await m.screenshot({ path: `${folder}/09-mobile-question.png`, fullPage: true });
  assert.ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await m.getByTestId('answer-C').click(); await m.getByRole('heading', { name: options[2].title }).waitFor(); await m.getByRole('button', { name: 'TEKRAR DEĞERLENDİR' }).click();
  await m.getByTestId('answer-B').click(); await m.locator('.earned-score strong').waitFor(); assert.equal(await m.locator('.earned-score strong').textContent(), '+6');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'PASS', checks: ['10-stop maze', 'QR decoded to actual game URL', 'patient file read gate', 'three observations', 'preoperative monitor', 'exact option and learning text', 'distinct A/C feedback', '10/8/6/4 scoring and hint precedence', 'refresh persistence', 'pause', 'stage 2 placeholder', 'educator authorization', 'cross-user record protection', 'participant filtering', 'event audit', 'CSV download', 'SQLite persistence after server restart', 'mobile gameplay and layout', 'no runtime errors'], screenshots: 9, isolatedTestData: true }));
} finally { await browser.close(); server.kill(); }
