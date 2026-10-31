import { query } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

export const GET = route(async (req) => {
  await requireActor('admin');
  if (req.nextUrl.searchParams.get('summary') === '1') {
    const rows = await query<{ action: string; n: number }>(
      'SELECT action, count(*)::INT AS n FROM prescription_audit GROUP BY action',
    );
    return Object.fromEntries(rows.map((r) => [r.action, r.n]));
  }
  const action = req.nextUrl.searchParams.get('action');
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 100) || 100, 500);
  return query(
    `SELECT * FROM v_prescription_audit_log
      WHERE ($1::TEXT IS NULL OR action = $1)
      ORDER BY changed_at DESC, audit_id DESC
      LIMIT $2`,
    [action || null, limit],
  );
});
