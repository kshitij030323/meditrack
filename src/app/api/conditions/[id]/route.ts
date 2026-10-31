import { query, queryOne } from '@/lib/db';
import { idParam, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

export const GET = route<IdParams>(async (_req, ctx) => {
  await requireActor('doctor', 'admin');
  const id = await idParam(ctx);
  const condition = await queryOne<{ name: string }>(
    'SELECT condition_id, name, description, red_flags FROM conditions_kb WHERE condition_id = $1',
    [id],
  );
  if (!condition) throw new ApiError(404, 'Condition not found.');
  const [cases, medications, neighbours] = await Promise.all([
    // Past cases closest to this condition's description (vector join, no FK involved).
    query(
      `SELECT cl.visit_id, cl.diagnosis, cl.outcome, cl.patient_age, cl.patient_gender, cl.department, cl.symptom_note,
              round((1 - (v.note_embedding <=> c.kb_embedding))::NUMERIC, 4) AS similarity
         FROM conditions_kb c
         CROSS JOIN visits v
         JOIN v_case_library cl ON cl.visit_id = v.visit_id
        WHERE c.condition_id = $1
        ORDER BY v.note_embedding <=> c.kb_embedding
        LIMIT 5`,
      [id],
    ),
    // Medications most often prescribed for this diagnosis (GROUP BY + HAVING).
    query(
      `SELECT m.medication_id, m.name, m.strength, count(*)::INT AS times
         FROM visits v
         JOIN prescriptions pr ON pr.visit_id = v.visit_id
         JOIN prescription_items pi ON pi.prescription_id = pr.prescription_id
         JOIN medications m ON m.medication_id = pi.medication_id
        WHERE v.diagnosis = $1
        GROUP BY m.medication_id
       HAVING count(*) >= 1
        ORDER BY times DESC
        LIMIT 6`,
      [condition.name],
    ),
    // Conditions nearest in embedding space ("often confused with").
    query(
      `SELECT o.condition_id, o.name, round((1 - (o.kb_embedding <=> c.kb_embedding))::NUMERIC, 4) AS similarity
         FROM conditions_kb c
         JOIN conditions_kb o ON o.condition_id <> c.condition_id
        WHERE c.condition_id = $1
        ORDER BY o.kb_embedding <=> c.kb_embedding
        LIMIT 4`,
      [id],
    ),
  ]);
  return { ...condition, cases, medications, neighbours };
});
