import { queryOne } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

export const POST = route(async () => {
  await requireActor('admin');
  const t0 = performance.now();
  await queryOne('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_diagnosis_stats');
  const ms = Math.round(performance.now() - t0);
  const row = await queryOne<{ n: number }>('SELECT count(*) AS n FROM mv_diagnosis_stats');
  return { ms, rows: row?.n ?? 0 };
});
