import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';

const schema = `CREATE TABLE IF NOT EXISTS participants (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, alias TEXT NOT NULL, alias_key TEXT UNIQUE NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, state TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);`;

export async function openDatabase(path) {
  if (process.env.TURSO_DATABASE_URL) {
    if (!process.env.ADMIN_PASSWORD) throw new Error('Bulut veritabanı için sabit ADMIN_PASSWORD ayarlanmalıdır.');
    const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    await client.executeMultiple(schema);
    return {
      persistence: 'turso',
      async get(sql, ...args) { return (await client.execute({ sql, args })).rows[0]; },
      async all(sql, ...args) { return (await client.execute({ sql, args })).rows; },
      async run(sql, ...args) { return client.execute({ sql, args }); },
      async batch(statements) { return client.batch(statements, 'write'); },
      close() { client.close(); }
    };
  }
  if (process.env.RENDER && process.env.ALLOW_EPHEMERAL_STORAGE !== 'true') throw new Error('Kalıcı kayıt için TURSO_DATABASE_URL ayarlayın. Geçici diske kayıt yapılmadı.');
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA journal_mode = WAL;'); sqlite.exec(schema);
  return {
    persistence: 'sqlite',
    async get(sql, ...args) { return sqlite.prepare(sql).get(...args); },
    async all(sql, ...args) { return sqlite.prepare(sql).all(...args); },
    async run(sql, ...args) { return sqlite.prepare(sql).run(...args); },
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { for (const { sql, args = [] } of statements) sqlite.prepare(sql).run(...args); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); }
  };
}
