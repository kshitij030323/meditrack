import pg from 'pg';

// Return numbers instead of strings for NUMERIC and BIGINT (count(*)), and keep
// DATE as a plain 'YYYY-MM-DD' string so it never shifts across time zones.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => parseFloat(v));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

type PoolCache = { app?: pg.Pool; reader?: pg.Pool };
const cache = globalThis as unknown as { __meditrackPools?: PoolCache };
const pools: PoolCache = (cache.__meditrackPools ??= {});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
  return value;
}

/** Application pool (owner role). Reused across hot reloads in dev. */
export function getPool(): pg.Pool {
  return (pools.app ??= new pg.Pool({ connectionString: requireEnv('DATABASE_URL'), max: 15 }));
}

/** Least-privilege pool used only by the DB Lab SQL console. */
export function getReaderPool(): pg.Pool {
  return (pools.reader ??= new pg.Pool({ connectionString: requireEnv('DATABASE_READER_URL'), max: 3 }));
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Runs `fn` inside BEGIN/COMMIT on one connection, rolling back on any error.
 * `app.user_id` is set transaction-locally so audit triggers record the actor.
 */
export async function withTransaction<T>(
  actorId: number | null,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    if (actorId) await client.query("SELECT set_config('app.user_id', $1, true)", [String(actorId)]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/** pgvector literal for a JS array, used as `$n::vector`. */
export function toVector(values: number[]): string {
  return `[${values.join(',')}]`;
}
