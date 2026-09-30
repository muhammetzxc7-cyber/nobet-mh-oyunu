import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const password = (await readFile('.data/egitmen-giris.txt', 'utf8')).trim();
const base = process.env.TEST_BASE || 'http://127.0.0.1:3001';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/#egitmen`);
  await page.getByLabel('Eğitmen giriş kodu').fill(password);
  await page.getByRole('button', { name: 'Panele gir' }).click();
  await page.getByRole('heading', { name: 'Katılımcı sonuçları' }).waitFor();
  if (await page.locator('.table-scroll tbody tr').count()) {
    await page.locator('.table-scroll tbody tr').first().getByRole('button', { name: /kararlarını incele/ }).click();
    assert.equal(await page.locator('.educator-stage-grid > div').count(), 10);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  }
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV indir' }).click();
  assert.equal((await download).suggestedFilename(), 'nobet-10-durak.csv');
  await page.getByRole('button', { name: 'Eğitmen çıkışı' }).click();
  await page.getByLabel('Eğitmen giriş kodu').waitFor();
  assert.deepEqual(errors, []);
  console.log('Educator login, results, CSV download, logout OK');
} finally { await browser.close(); }
