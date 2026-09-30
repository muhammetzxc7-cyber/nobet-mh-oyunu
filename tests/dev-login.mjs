import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const password = (await readFile('.data/egitmen-giris.txt', 'utf8')).trim();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:5173/#egitmen', { waitUntil: 'networkidle' });
  await page.getByLabel('Eğitmen giriş kodu').fill(password);
  await page.getByRole('button', { name: 'Güvenli giriş' }).click();
  await page.getByRole('heading', { name: 'Her katılımcının yolculuğu.' }).waitFor();
  const invalidAliasStatus = await page.evaluate(async () => {
    const response = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias: 'ab' }) });
    return response.status;
  });
  assert.equal(invalidAliasStatus, 400, 'local registration reaches validation rather than origin rejection');
  const blockedCrossOrigin = await fetch('http://localhost:3001/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' }, body: JSON.stringify({ alias: 'ab' }) });
  assert.equal(blockedCrossOrigin.status, 403, 'unrelated origins stay blocked');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'PASS', checks: ['Vite proxy educator login', 'Vite proxy registration reaches validation', 'unrelated origins rejected', 'no browser errors'] }));
} finally { await browser.close(); }
