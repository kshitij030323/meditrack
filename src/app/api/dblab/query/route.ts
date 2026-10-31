import { z } from 'zod';
import type pg from 'pg';
import { getReaderPool } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';

const MAX_ROWS = 200;

/**
 * Read-only SQL console. Runs as the meditrack_reader role (SELECT-only grants,
 * no access to users.password_hash, 5 s statement timeout) inside a READ ONLY
 * transaction that is always rolled back. The extended query protocol rejects
 * multi-statement input, so `SELECT 1; DROP TABLE x` cannot be smuggled in.
 */
export const POST = route(async (req) => {
  await requireActor('admin');
  const { sql } = z.object({ sql: z.string().trim().min(1).max(20000) }).parse(await readJson(req));
  const text = sql.replace(/;\s*$/, '');
  const client = await getReaderPool().connect();
  const started = performance.now();
  try {
    await client.query('BEGIN READ ONLY');
    const result = await client.query({ text, rowMode: 'array', queryMode: 'extended' } as pg.QueryConfig & {
      queryMode: 'extended';
    });
    const ms = Math.round((performance.now() - started) * 10) / 10;
    const rows = (result.rows as unknown[][]) ?? [];
    return {
      ok: true,
      command: result.command,
      columns: (result.fields ?? []).map((f) => f.name),
      rows: rows.slice(0, MAX_ROWS),
      rowCount: result.rowCount ?? rows.length,
      truncated: rows.length > MAX_ROWS,
      ms,
    };
  } catch (err) {
    const e = err as { message: string; code?: string; position?: string; hint?: string };
    return Response.json(
      { ok: false, error: e.message, code: e.code, position: e.position, hint: e.hint },
      { status: 400 },
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    client.release();
  }
});
