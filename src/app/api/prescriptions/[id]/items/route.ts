import { withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { assertVisitOwner, visitOfPrescription } from '@/lib/ownership';
import { RxItemInput } from '@/lib/schemas';

// Adding a line fires the validation (interaction + stock) and audit triggers.
export const POST = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor('doctor');
  const prescriptionId = await idParam(ctx);
  const item = RxItemInput.parse(await readJson(req));
  return withTransaction(actor.id, async (db) => {
    await assertVisitOwner(db, actor.id, await visitOfPrescription(db, prescriptionId));
    const { rows } = await db.query(
      `INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days)
       VALUES ($1, $2, $3, upper($4), $5) RETURNING item_id`,
      [prescriptionId, item.medication_id, item.dosage, item.frequency, item.duration_days],
    );
    return rows[0];
  });
});
