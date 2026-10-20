import express from 'express';
import { openDatabase } from './database.mjs';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { applyAnswer, scoreFor, safeCsv } from './course.mjs';
import { stages } from '../src/full-course.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(process.env.DATA_DIR || resolve(root, '.data'));
mkdirSync(dataDir, { recursive: true });
const credentialPath = resolve(dataDir, 'egitmen-giris.txt');
if (!process.env.ADMIN_PASSWORD && !existsSync(credentialPath)) writeFileSync(credentialPath, randomBytes(18).toString('base64url'), { mode: 0o600 });
const adminPassword = process.env.ADMIN_PASSWORD || readFileSync(credentialPath, 'utf8').trim();
const hash = value => createHash('sha256').update(value).digest('hex');
const db = await openDatabase(resolve(dataDir, 'nobet.sqlite'));
const app = express();
app.disable('x-powered-by'); app.set('trust proxy', 1);
app.use(express.json({ limit: '8kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'same-origin');
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  if (req.method === 'POST' && req.get('origin')) {
    let okay = false;
    try {
      const origin = new URL(req.get('origin'));
      const sameHost = origin.host === req.get('host');
      const publishedHost = process.env.PUBLIC_URL && origin.origin === new URL(process.env.PUBLIC_URL).origin;
      // Vite serves the UI on :5173 and proxies /api to the loopback API on :3001.
      // Accept that exact local development path while keeping unrelated origins blocked.
      const privateAddress = /^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(origin.hostname);
      const loopbackProxy = /^(::1|::ffff:127\.0\.0\.1|127\.0\.0\.1)$/.test(req.ip || '');
      const localDev = process.env.NODE_ENV !== 'production' && loopbackProxy && origin.protocol === 'http:' && ['5173', '4173'].includes(origin.port) && privateAddress;
      okay = sameHost || publishedHost || localDev;
    } catch {}
    if (!okay) return res.status(403).json({ error: 'Bu kaynaktan işlem yapılamıyor.' });
  }
  next();
});
const limits = new Map();
function limit(req, res, next) {
  const key = `${req.ip}:${req.path}`, now = Date.now();
  if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  const entry = limits.get(key);
  if (entry && entry.until > now && entry.count >= 20) return res.status(429).json({ error: 'Çok fazla deneme. Bir dakika sonra tekrar deneyin.' });
  limits.set(key, entry && entry.until > now ? { ...entry, count: entry.count + 1 } : { count: 1, until: now + 60000 }); next();
}
const nowIso = () => new Date().toISOString();
function publicSession(row) { return { id: row.id, alias: row.alias, createdAt: row.created_at, updatedAt: row.updated_at, ...JSON.parse(row.state) }; }
async function event(id, action, detail = '') { (await db.run('INSERT INTO events(participant_id, action, detail, at) VALUES(?,?,?,?)', id, action, detail, nowIso())); }
async function participant(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer /, '') || '';
  const row = (await db.get('SELECT * FROM participants WHERE id = ? AND token_hash = ?', req.params.id, hash(token)));
  if (!row) return res.status(401).json({ error: 'Oturum bulunamadı. Rumuz ekranından tekrar giriş yapın.' });
  req.participant = row; req.course = JSON.parse(row.state); next();
}
async function save(req, res, state, action, detail) {
  await db.batch([
    { sql: 'UPDATE participants SET state = ?, updated_at = ? WHERE id = ?', args: [JSON.stringify(state), nowIso(), req.participant.id] },
    { sql: 'INSERT INTO events(participant_id, action, detail, at) VALUES(?,?,?,?)', args: [req.participant.id, action, detail || '', nowIso()] }
  ]);
  res.json(publicSession((await db.get('SELECT * FROM participants WHERE id = ?', req.participant.id))));
}
async function educator(req, res, next) {
  const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('nobet_admin='))?.slice(12) || '';
  const session = (await db.get('SELECT expires_at FROM admin_sessions WHERE token_hash = ?', hash(token)));
  if (!session || session.expires_at < Date.now()) return res.status(401).json({ error: 'Eğitmen girişi gerekiyor.' });
  next();
}
const participantLocks = new Map();
app.use('/api/sessions/:id', async (req, res, next) => {
  const id = req.params.id; const previous = participantLocks.get(id) || Promise.resolve();
  let release; const current = new Promise(resolve => { release = resolve; }); participantLocks.set(id, current);
  await previous; let released = false;
  const done = () => { if (released) return; released = true; release(); if (participantLocks.get(id) === current) participantLocks.delete(id); };
  res.once('finish', done); res.once('close', done);
  if (res.destroyed) done(); else next();
});
app.get('/api/health', (req, res) => res.json({ ok: true, course: 'mh-10-stops', persistence: db.persistence }));
app.get('/api/share', async (req, res) => {
  let url = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  if (!process.env.PUBLIC_URL && /localhost|127\.0\.0\.1/.test(req.get('host') || '')) {
    const address = Object.values(networkInterfaces()).flat().find(n => n && n.family === 'IPv4' && !n.internal && /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(n.address));
    if (address) url = `http://${address.address}:${req.get('host').split(':')[1] || '3001'}`;
  }
  const invite = new URL(url);
  invite.hash = '';
  invite.searchParams.set('view', 'auto');
  res.json({ url: invite.toString(), local: /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(invite.hostname), temporary: invite.hostname.endsWith('.trycloudflare.com') });
});
app.post('/api/sessions', limit, async (req, res) => {
  const alias = typeof req.body.alias === 'string' ? req.body.alias.trim().normalize('NFC') : '';
  if (!/^[\p{L}\p{N}_ .-]{3,24}$/u.test(alias)) return res.status(400).json({ error: 'Rumuz 3–24 karakter olmalı; harf, sayı, boşluk, nokta, tire veya alt çizgi kullanabilirsin.' });
  const token = randomBytes(32).toString('base64url'), id = randomBytes(12).toString('hex'), now = nowIso();
  const state = { phase: 'case', attempts: 0, wrong: [], hints: [], hintUsed: false, solved: false, learned: false, score: 0, lastChoice: null, completedAt: null };
  try { (await db.run('INSERT INTO participants VALUES(?,?,?,?,?,?,?)', id, hash(token), alias, alias.toLocaleLowerCase('tr-TR'), now, now, JSON.stringify(state))); }
  catch (error) { if (String(error).includes('UNIQUE')) return res.status(409).json({ error: 'Bu rumuz kullanılıyor. Başka bir rumuz seç veya aynı tarayıcıdaki kayıtlı oturumuna devam et.' }); throw error; }
  await event(id, 'Giriş', alias); res.status(201).json({ session: publicSession((await db.get('SELECT * FROM participants WHERE id = ?', id))), token });
});
app.get('/api/sessions/:id', participant, (req, res) => res.json(publicSession(req.participant)));
app.post('/api/sessions/:id/enter', participant, async (req, res) => {
  if (req.course.phase !== 'case') return res.json(publicSession(req.participant));
  await save(req, res, { ...req.course, phase: 'observation' }, 'Ameliyathaneye giriş');
});
app.post('/api/sessions/:id/observed', participant, async (req, res) => {
  if (req.course.phase !== 'observation') return res.status(409).json({ error: 'Önce hasta dosyasını inceleyip ameliyathaneye gir.' });
  await save(req, res, { ...req.course, phase: 'question' }, 'Senaryo gözlemlendi');
});
app.post('/api/sessions/:id/hint', participant, async (req, res) => {
  if (req.course.phase !== 'question' || req.course.solved) return res.status(409).json({ error: 'İpucu bu aşamada kullanılamaz.' });
  if (!['A', 'B', 'C'].includes(req.body.choice)) return res.status(400).json({ error: 'Geçersiz ipucu.' });
  if (req.course.hints.includes(req.body.choice)) return res.json(publicSession(req.participant));
  await save(req, res, { ...req.course, hintUsed: true, hints: [...req.course.hints, req.body.choice] }, 'İpucu', req.body.choice);
});
app.post('/api/sessions/:id/answer', participant, async (req, res) => {
  if (req.course.phase !== 'question') return res.status(409).json({ error: 'Bu aşamada yanıt verilemez.' });
  try {
    const state = applyAnswer(req.course, req.body.choice);
    await save(req, res, { ...state, phase: state.solved ? 'learning' : 'question', lastChoice: req.body.choice, hintUsed: state.hintUsed || !state.solved }, state.solved ? 'Doğru karar' : 'Yanlış karar', `${req.body.choice}; puan=${state.score}`);
  } catch (error) { res.status(409).json({ error: error.message }); }
});
app.post('/api/sessions/:id/learned', participant, async (req, res) => {
  if (!req.course.solved) return res.status(409).json({ error: 'Önce doğru kararı verip öğrenme kartını tamamla.' });
  if (req.course.learned) return res.json(publicSession(req.participant));
  await save(req, res, { ...req.course, learned: true, phase: 'complete', completedAt: nowIso() }, 'Öğrenme kartı tamamlandı', `Durak 1: ${req.course.score}/10`);
});
app.post('/api/sessions/:id/stop2/start', participant, async (req, res) => {
  if (!req.course.learned) return res.status(409).json({ error: 'Önce ilk durağı tamamla.' });
  if (req.course.stop2?.completed) return res.json(publicSession(req.participant));
  await save(req, res, { ...req.course, phase: 'stop2', stop2: req.course.stop2 || { selected: [], wrong: 0, hintUsed: false, completed: false, score: 0 } }, 'Durak 2 başladı');
});
app.post('/api/sessions/:id/stop2/hint', participant, async (req, res) => {
  if (req.course.phase !== 'stop2') return res.status(409).json({ error: 'Durak 2 aktif değil.' });
  await save(req, res, { ...req.course, stop2: { ...req.course.stop2, hintUsed: true } }, 'Durak 2 ipucu');
});
app.post('/api/sessions/:id/stop2/answer', participant, async (req, res) => {
  if (req.course.phase !== 'stop2') return res.status(409).json({ error: 'Durak 2 aktif değil.' });
  const choice = req.body.choice;
  if (!['A', 'B', 'C'].includes(choice)) return res.status(400).json({ error: 'Geçersiz seçenek.' });
  const old = req.course.stop2;
  const correct = choice === 'B';
  const wrong = old.wrong + Number(!correct);
  const hintUsed = old.hintUsed || !correct;
  const score = correct ? scoreFor(old.wrong, hintUsed) : 0;
  await save(req, res, { ...req.course, phase: correct ? 'stop2-learning' : 'stop2', score: req.course.score + score, stop2: { ...old, wrong, hintUsed, completed: correct, score } }, correct ? 'Durak 2 doğru karar' : 'Durak 2 yanlış karar', choice);
});
app.post('/api/sessions/:id/stop2/card', participant, async (req, res) => {
  if (req.course.phase !== 'stop2') return res.status(409).json({ error: 'Durak 2 aktif değil.' });
  const triggers = ['Sevofluran', 'Desfluran', 'İzofluran', 'Süksinilkolin'];
  const choice = req.body.choice;
  if (!triggers.includes(choice) && !['Propofol', 'Roküronyum'].includes(choice)) return res.status(400).json({ error: 'Geçersiz kart.' });
  const old = req.course.stop2;
  if (old.selected.includes(choice)) return res.json(publicSession(req.participant));
  const correct = triggers.includes(choice);
  const selected = correct ? [...old.selected, choice] : old.selected;
  const wrong = old.wrong + (correct ? 0 : 1);
  const completed = selected.length === triggers.length;
  const score = completed ? scoreFor(wrong, old.hintUsed) : 0;
  await save(req, res, { ...req.course, phase: completed ? 'stop2-learning' : 'stop2', score: req.course.score + score, stop2: { ...old, selected, wrong, completed, score } }, correct ? 'Durak 2 doğru kart' : 'Durak 2 yanlış kart', choice);
});
app.post('/api/sessions/:id/stop2/learned', participant, async (req, res) => {
  if (req.course.phase !== 'stop2-learning') return res.status(409).json({ error: 'Önce doğru kararı ver.' });
  await save(req, res, { ...req.course, phase: 'complete', completedAt: nowIso() }, 'Durak 2 öğrenme kartı tamamlandı', `Durak 2: ${req.course.stop2.score}/10`);
});
function courseStep(req) { const c = req.course.course; return c && stages[c.stage]; }
async function courseSave(req, res, next, action, detail) {
  const c = req.course.course;
  if (next) {
      const earned = scoreFor(c.wrong, c.hintUsed);
      c.results = [...c.results, { stage: c.stage, score: earned, wrong: c.wrong, hintUsed: c.hintUsed, firstTry: c.firstTry, durationMs: Date.now() - c.stageStartedAt }];
      c.stageScore = earned;
      req.course.score += earned;
      req.course.phase = 'course-learning';
  }
  await save(req, res, req.course, action, detail);
}
app.post('/api/sessions/:id/course/next', participant, async (req, res) => {
  if (!req.course.stop2?.completed) return res.status(409).json({ error: 'Önce ikinci durağı tamamla.' });
  if (req.course.phase === 'finished') return res.json(publicSession(req.participant));
  if (!req.course.course) {
    req.course.course = { stage: 3, step: 0, selected: [], sequenceIndex: 0, wrong: 0, hintUsed: false, firstTry: true, results: [], stageStartedAt: Date.now(), startedAt: Date.parse(req.participant.created_at), stageScore: 0 };
    req.course.completedAt = null;
  } else if (req.course.phase === 'course-learning') {
    if (req.course.course.stage === 10) {
      req.course.phase = 'finished'; req.course.completedAt = nowIso();
      return await save(req, res, req.course, 'Labirent tamamlandı');
    }
    Object.assign(req.course.course, { stage: req.course.course.stage + 1, step: 0, selected: [], sequenceIndex: 0, wrong: 0, hintUsed: false, firstTry: true, stageStartedAt: Date.now(), stageScore: 0 });
  } else if (req.course.phase !== 'complete' && req.course.phase !== 'course') return res.status(409).json({ error: 'Durak geçişi şu anda yapılamaz.' });
  req.course.phase = 'course'; await save(req, res, req.course, 'Yeni durak', String(req.course.course.stage));
});
app.post('/api/sessions/:id/course/hint', participant, async (req, res) => {
  if (req.course.phase !== 'course') return res.status(409).json({ error: 'İpucu şu anda kullanılamaz.' });
  req.course.course.hintUsed = true; await save(req, res, req.course, 'İpucu', String(req.course.course.stage));
});
app.post('/api/sessions/:id/course/act', participant, async (req, res) => {
  if (req.course.phase !== 'course') return res.status(409).json({ error: 'Bu durakta karar verilemez.' });
  const step = courseStep(req), c = req.course.course, value = req.body.value;
  if (!step) return res.status(409).json({ error: 'Durak bulunamadı.' });
  if (!Number.isInteger(value) || value < 0 || value >= step.options.length) return res.status(400).json({ error: 'Geçersiz yanıt.' });
  const correct = value === step.correct;
  if (!correct) { c.wrong++; c.firstTry = false; c.hintUsed = true; }
  await courseSave(req, res, correct, correct ? 'Doğru karar' : 'Yanlış karar', `${c.stage}: ${JSON.stringify(value)}`);
});
app.post('/api/admin/login', limit, async (req, res) => {
  const input = hash(String(req.body.password || '')), expected = hash(adminPassword);
  if (!timingSafeEqual(Buffer.from(input), Buffer.from(expected))) return res.status(401).json({ error: 'Eğitmen giriş kodu doğru değil.' });
  const token = randomBytes(32).toString('base64url');
  (await db.run('DELETE FROM admin_sessions WHERE expires_at < ?', Date.now()));
  (await db.run('INSERT INTO admin_sessions VALUES(?,?)', hash(token), Date.now() + 8 * 3600000));
  res.cookie('nobet_admin', token, { httpOnly: true, secure: req.secure, sameSite: 'strict', maxAge: 8 * 3600000, path: '/api/admin' });
  res.json({ ok: true });
});
app.post('/api/admin/logout', async (req, res) => {
  const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('nobet_admin='))?.slice(12) || '';
  (await db.run('DELETE FROM admin_sessions WHERE token_hash = ?', hash(token)));
  res.clearCookie('nobet_admin', { path: '/api/admin' }); res.json({ ok: true });
});
app.get('/api/admin/results', educator, async (req, res) => {
  const counts = new Map((await db.all("SELECT participant_id, COUNT(*) AS n FROM events WHERE action IN ('Doğru karar','Yanlış karar','Durak 2 doğru kart','Durak 2 yanlış kart','Durak 2 doğru karar','Durak 2 yanlış karar') GROUP BY participant_id")).map(row => [row.participant_id, row.n]));
  const rows = (await db.all('SELECT * FROM participants ORDER BY created_at DESC')).map(row => ({ ...publicSession(row), decisionCount: counts.get(row.id) || 0 }));
  res.json({ participants: rows, total: rows.length, completed: rows.filter(p => p.phase === 'finished').length });
});
app.get('/api/admin/results/:id/events', educator, async (req, res) => {
  res.json((await db.all('SELECT action, detail, at FROM events WHERE participant_id = ? ORDER BY id', req.params.id)));
});
app.get('/api/admin/export', educator, async (req, res) => {
  const rows = (await db.all('SELECT * FROM participants ORDER BY created_at DESC')).map(publicSession);
  const decisions = new Map((await db.all("SELECT participant_id, COUNT(*) AS n FROM events WHERE action IN ('Doğru karar','Yanlış karar','Durak 2 doğru kart','Durak 2 yanlış kart','Durak 2 doğru karar','Durak 2 yanlış karar') GROUP BY participant_id")).map(row => [row.participant_id, row.n]));
  const csv = [['Rumuz', 'Tamamlanan durak', 'Puan / 100', 'Karar sayısı', 'Yanlış sayısı', 'İpucu sayısı', 'İlk denemede doğru durak', 'Süre (saniye)', 'Durum', 'Başlangıç', 'Tamamlanma', ...Array.from({ length: 10 }, (_, i) => `Durak ${i + 1} puanı`), ...Array.from({ length: 10 }, (_, i) => `Durak ${i + 1} ilk deneme`) ],
    ...rows.map(p => {
      const r = p.course?.results || [];
      const currentWrong = p.phase === 'course' ? p.course?.wrong || 0 : 0;
      const currentHint = p.phase === 'course' ? Number(p.course?.hintUsed) : 0;
      const stage1Score = p.learned ? p.score - (p.stop2?.score || 0) - r.reduce((n, x) => n + x.score, 0) : '';
      const scores = [stage1Score, p.stop2?.completed ? p.stop2.score : '', ...Array.from({ length: 8 }, (_, i) => r.find(x => x.stage === i + 3)?.score ?? '')];
      const firstTry = [p.learned ? p.wrong.length === 0 : null, p.stop2?.completed ? p.stop2.wrong === 0 : null, ...Array.from({ length: 8 }, (_, i) => r.find(x => x.stage === i + 3)?.firstTry ?? null)];
      const end = p.phase === 'finished' && p.completedAt ? Date.parse(p.completedAt) : Date.now();
      return [p.alias, Number(p.learned) + Number(p.stop2?.completed) + r.length, p.score, decisions.get(p.id) || 0, p.wrong.length + (p.stop2?.wrong || 0) + r.reduce((n, x) => n + x.wrong, 0) + currentWrong, Number(p.hintUsed) + Number(p.stop2?.hintUsed) + r.filter(x => x.hintUsed).length + currentHint, firstTry.filter(Boolean).length, Math.max(0, Math.round((end - Date.parse(p.createdAt)) / 1000)), p.phase === 'finished' ? 'Tamamlandı' : 'Devam ediyor', p.createdAt, p.phase === 'finished' ? p.completedAt || '' : '', ...scores, ...firstTry.map(x => x === null ? '' : x ? 'Evet' : 'Hayır')];
    })];
  res.set('Content-Type', 'text/csv; charset=utf-8'); res.set('Content-Disposition', 'attachment; filename="nobet-10-durak.csv"');
  res.send('\uFEFF' + csv.map(row => row.map(safeCsv).join(';')).join('\r\n'));
});
app.use('/api', (req, res) => res.status(404).json({ error: 'İşlem bulunamadı.' }));
app.use(express.static(resolve(root, 'dist')));
app.get('/{*path}', async (req, res) => {
  if (existsSync(resolve(root, 'dist/index.html'))) return res.sendFile(resolve(root, 'dist/index.html'));
  res.status(503).send('Önce npm run build çalıştırın veya geliştirme için http://localhost:5173 adresini açın.');
});
app.use((error, req, res, next) => { console.error(error.message); res.status(500).json({ error: 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.' }); });
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Nöbet sunucusu: http://localhost:${port}`);
  console.log(`Eğitmen giriş kodu ${process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD ile ayarlı.' : 'dosyası: ' + credentialPath}`);
});
process.on('SIGTERM', () => server.close(() => { db.close(); process.exit(0); }));

