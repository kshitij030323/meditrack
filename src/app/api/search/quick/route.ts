import { query } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

/** Command-palette lookup: trigram/ILIKE matches across patients, medications and conditions. */
export const GET = route(async (req) => {
  const actor = await requireActor();
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2 || actor.role === 'patient') return { patients: [], medications: [], conditions: [] };
  const [patients, medications, conditions] = await Promise.all([
    actor.role === 'doctor'
      ? query(
          `SELECT patient_id AS id, full_name AS title, age, gender FROM v_patient_overview
            WHERE full_name ILIKE '%' || $1 || '%' OR similarity(full_name, $1) > 0.3
            ORDER BY similarity(full_name, $1) DESC LIMIT 5`,
          [q],
        )
      : Promise.resolve([]),
    query(
      `SELECT medication_id AS id, name AS title, strength, form FROM medications
        WHERE name ILIKE '%' || $1 || '%' OR similarity(name, $1) > 0.3
        ORDER BY similarity(name, $1) DESC LIMIT 5`,
      [q],
    ),
    actor.role === 'doctor'
      ? query(
          `SELECT condition_id AS id, name AS title FROM conditions_kb
            WHERE name ILIKE '%' || $1 || '%' OR kb_tsv @@ plainto_tsquery('english', $1)
            ORDER BY (name ILIKE '%' || $1 || '%') DESC, ts_rank_cd(kb_tsv, plainto_tsquery('english', $1)) DESC LIMIT 5`,
          [q],
        )
      : Promise.resolve([]),
  ]);
  return { patients, medications, conditions };
});
