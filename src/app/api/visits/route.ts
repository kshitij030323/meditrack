import { z } from 'zod';
import { toVector, withTransaction } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { RxItemInput } from '@/lib/schemas';

const LabInput = z.object({
  test_name: z.string().trim().min(1),
  result_value: z.coerce.number(),
  unit: z.string().trim().nullish(),
  ref_range: z.string().trim().nullish(),
});

const VisitInput = z.object({
  appointment_id: z.coerce.number().int(),
  symptom_note: z.string(),
  diagnosis: z.string().trim().nullish(),
  follow_up_date: z.string().nullish(),
  outcome: z.enum(['resolved', 'improving', 'unchanged', 'referred', 'admitted']).nullish(),
  prescription: z.object({ notes: z.string().nullish(), items: z.array(RxItemInput) }).nullish(),
  labs: z.array(LabInput).default([]),
});

/**
 * Records a consultation in ONE transaction:
 *   sp_record_visit (visit + appointment -> completed)
 *   sp_issue_prescription (items fire validation, stock and audit triggers)
 *   lab_results insert (status graded by trigger)
 * Any failure (a severe interaction, missing stock, a CHECK) rolls all of it back.
 */
export const POST = route(async (req) => {
  const actor = await requireActor('doctor');
  const body = VisitInput.parse(await readJson(req));
  // The embedding is computed before the transaction so no locks are held during inference.
  const embedding = await embed(`${body.symptom_note}`);

  return withTransaction(actor.id, async (db) => {
    const visit = await db.query<{ p_visit_id: number }>(
      'CALL sp_record_visit($1, $2, $3, $4::vector, $5, $6::DATE, $7, NULL)',
      [body.appointment_id, actor.id, body.symptom_note, toVector(embedding), body.diagnosis ?? null,
       body.follow_up_date || null, body.outcome ?? null],
    );
    const visitId = visit.rows[0].p_visit_id;

    let prescriptionId: number | null = null;
    if (body.prescription && body.prescription.items.length > 0) {
      const rx = await db.query<{ p_prescription_id: number }>(
        'CALL sp_issue_prescription($1, $2, $3::JSONB, NULL)',
        [visitId, body.prescription.notes ?? null, JSON.stringify(body.prescription.items)],
      );
      prescriptionId = rx.rows[0].p_prescription_id;
    }

    for (const lab of body.labs) {
      await db.query(
        `INSERT INTO lab_results (visit_id, test_name, result_value, unit, ref_range) VALUES ($1, $2, $3, $4, $5)`,
        [visitId, lab.test_name, lab.result_value, lab.unit || null, lab.ref_range || null],
      );
    }
    return { visit_id: visitId, prescription_id: prescriptionId };
  });
});
