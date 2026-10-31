import { query } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

// Patient directory. Fuzzy name matching uses the pg_trgm GIN index.
export const GET = route(async (req) => {
  await requireActor('doctor', 'admin');
  const q = req.nextUrl.searchParams.get('q')?.trim() || null;
  return query(
    `SELECT patient_id, full_name, email, is_active, age, gender, blood_group, phone,
            visit_count, last_visit_at, next_appointment_at, no_show_count
       FROM v_patient_overview
      WHERE $1::TEXT IS NULL OR full_name ILIKE '%' || $1 || '%' OR similarity(full_name, $1) > 0.3 OR phone LIKE $1 || '%'
      ORDER BY CASE WHEN $1::TEXT IS NULL THEN 0 ELSE similarity(full_name, $1) END DESC, last_visit_at DESC NULLS LAST, full_name`,
    [q],
  );
});
