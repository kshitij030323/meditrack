import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';

export const GET = route(async () => {
  await requireActor('admin', 'doctor');
  return query(
    `SELECT di.interaction_id, di.severity, di.description,
            ma.medication_id AS a_id, ma.name AS a_name, mb.medication_id AS b_id, mb.name AS b_name
       FROM drug_interactions di
       JOIN medications ma ON ma.medication_id = di.medication_a_id
       JOIN medications mb ON mb.medication_id = di.medication_b_id
      ORDER BY CASE di.severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END, ma.name`,
  );
});

const InteractionInput = z.object({
  a_id: z.coerce.number().int(),
  b_id: z.coerce.number().int(),
  severity: z.enum(['minor', 'moderate', 'severe']),
  description: z.string().trim().min(5),
});

// The pair is stored in canonical order (a < b) to satisfy chk_di_distinct / uq_di_pair.
export const POST = route(async (req) => {
  await requireActor('admin');
  const b = InteractionInput.parse(await readJson(req));
  return queryOne(
    `INSERT INTO drug_interactions (medication_a_id, medication_b_id, severity, description)
     VALUES (LEAST($1::INT, $2::INT), GREATEST($1::INT, $2::INT), $3, $4) RETURNING interaction_id`,
    [b.a_id, b.b_id, b.severity, b.description],
  );
});
