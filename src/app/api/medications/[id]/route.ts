import { query, queryOne, toVector } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { ApiError } from '@/lib/errors';
import { z } from 'zod';
import { medicationText } from '@/lib/schemas';

// Explicit patch schema: MedicationInput.partial() would still apply the
// reorder_level default (50) and silently overwrite it on every edit.
const MedicationPatch = z.object({
  name: z.string().trim().optional(),
  form: z.string().trim().optional(),
  strength: z.string().trim().optional(),
  drug_class: z.string().trim().optional(),
  description: z.string().trim().optional(),
  stock_qty: z.coerce.number().int().optional(),
  unit_price: z.coerce.number().optional(),
  reorder_level: z.coerce.number().int().optional(),
});

export const GET = route<IdParams>(async (_req, ctx) => {
  await requireActor('admin', 'doctor');
  const id = await idParam(ctx);
  const med = await queryOne('SELECT * FROM v_medication_stock WHERE medication_id = $1', [id]);
  if (!med) throw new ApiError(404, 'Medication not found.');
  const [interactions, usage] = await Promise.all([
    query(
      `SELECT di.interaction_id, di.severity, di.description, other.medication_id, other.name
         FROM drug_interactions di
         JOIN medications other
           ON other.medication_id = CASE WHEN di.medication_a_id = $1 THEN di.medication_b_id ELSE di.medication_a_id END
        WHERE $1 IN (di.medication_a_id, di.medication_b_id)
        ORDER BY CASE di.severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END, other.name`,
      [id],
    ),
    // Which diagnoses this drug is prescribed for (JOIN + GROUP BY).
    query(
      `SELECT v.diagnosis, count(*)::INT AS times, round(avg(pi.duration_days), 1) AS avg_days
         FROM prescription_items pi
         JOIN prescriptions pr ON pr.prescription_id = pi.prescription_id
         JOIN visits v ON v.visit_id = pr.visit_id
        WHERE pi.medication_id = $1 AND v.diagnosis IS NOT NULL
        GROUP BY v.diagnosis
        ORDER BY times DESC
        LIMIT 6`,
      [id],
    ),
  ]);
  return { ...med, interactions, usage };
});

export const PATCH = route<IdParams>(async (req, ctx) => {
  await requireActor('admin');
  const id = await idParam(ctx);
  const body = MedicationPatch.parse(await readJson(req));
  const current = await queryOne<{ name: string; form: string; drug_class: string | null; description: string | null }>(
    'SELECT name, form, drug_class, description FROM medications WHERE medication_id = $1',
    [id],
  );
  if (!current) throw new ApiError(404, 'Medication not found.');
  const next = { ...current, ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  const textChanged = medicationText(next) !== medicationText(current);
  const embedding = textChanged ? toVector(await embed(medicationText(next))) : null;
  await queryOne(
    `UPDATE medications
        SET name = COALESCE($2, name), form = COALESCE($3, form), strength = COALESCE($4, strength),
            drug_class = COALESCE($5, drug_class), description = COALESCE($6, description),
            stock_qty = COALESCE($7, stock_qty), unit_price = COALESCE($8, unit_price),
            reorder_level = COALESCE($9, reorder_level), med_embedding = COALESCE($10::vector, med_embedding)
      WHERE medication_id = $1`,
    [id, body.name ?? null, body.form ?? null, body.strength ?? null, body.drug_class ?? null, body.description ?? null,
     body.stock_qty ?? null, body.unit_price ?? null, body.reorder_level ?? null, embedding],
  );
  return { ok: true, reembedded: textChanged };
});
