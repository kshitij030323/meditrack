/**
 * Applies db/*.sql in order. `--drop` runs 00_drop.sql first (full rebuild).
 * Also (re)creates the read-only login role used by the DB Lab SQL console,
 * with its password taken from DB_READER_PASSWORD rather than a SQL file.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '..', 'db');
const drop = process.argv.includes('--drop');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (expected in .env.local)');

const client = new pg.Client({ connectionString: url });
await client.connect();

const files = readdirSync(dbDir)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => drop || !f.startsWith('00_'))
  .sort();

for (const file of files) {
  const sql = readFileSync(path.join(dbDir, file), 'utf8');
  const started = Date.now();
  try {
    await client.query(sql);
    console.log(`  ✓ ${file} (${Date.now() - started} ms)`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${(err as Error).message}`);
    await client.end();
    process.exit(1);
  }
}

const { rows } = await client.query<{ db: string }>('SELECT current_database() AS db');
const dbName = client.escapeIdentifier(rows[0].db);
await client.query(`ALTER DATABASE ${dbName} SET timezone TO 'Asia/Kolkata'`);

// Least-privilege role for ad-hoc SQL: SELECT only, read-only transactions,
// a statement timeout, and no access to users.password_hash (column grant).
const readerPassword = process.env.DB_READER_PASSWORD;
if (readerPassword) {
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'meditrack_reader') THEN
        CREATE ROLE meditrack_reader LOGIN;
      END IF;
    END $$;`);
  await client.query(`ALTER ROLE meditrack_reader WITH LOGIN PASSWORD ${client.escapeLiteral(readerPassword)}`);
  await client.query(`
    GRANT CONNECT ON DATABASE ${dbName} TO meditrack_reader;
    GRANT USAGE ON SCHEMA public TO meditrack_reader;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO meditrack_reader;
    REVOKE SELECT ON users FROM meditrack_reader;
    GRANT SELECT (user_id, email, full_name, role, is_active, created_at) ON users TO meditrack_reader;
    ALTER ROLE meditrack_reader SET default_transaction_read_only = on;
    ALTER ROLE meditrack_reader SET statement_timeout = '5s';
    ALTER ROLE meditrack_reader SET timezone = 'Asia/Kolkata';`);
  console.log('  ✓ read-only role meditrack_reader');
}

await client.end();
console.log(drop ? 'Database rebuilt.' : 'Migrations applied.');
