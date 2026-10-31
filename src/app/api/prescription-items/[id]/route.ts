import { z } from 'zod';
import { withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { assertVisitOwner, prescriptionOfItem, visitOfPrescription } from '@/lib/ownership';

const ItemPatch = z.object({
  dosage: z.string().trim().optional(),
  frequency: z.string().trim().optional(),
  duration_days: z.coerce.number().int().optional(),
});

// UPDATE and DELETE are captured by trg_rx_items_audit with before/after images.
export const PATCH = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor('doctor');
  const itemId = await idParam(ctx);
  const body = ItemPatch.parse(await readJson(req));
  return withTransaction(actor.id, async (db) => {
    await assertVisitOwner(db, actor.id, await visitOfPrescription(db, await prescriptionOfItem(db, itemId)));
    await db.query(
      `UPDATE prescription_items
          SET dosage        = COALESCE($2, dosage),
              frequency     = COALESCE(upper($3), frequency),
              duration_days = COALESCE($4, duration_days)
        WHERE item_id = $1`,
      [itemId, body.dosage ?? null, body.frequency ?? null, body.duration_days ?? null],
    );
    return { ok: true };
  });
});

export const DELETE = route<IdParams>(async (_req, ctx) => {
  const actor = await requireActor('doctor');
  const itemId = await idParam(ctx);
  return withTransaction(actor.id, async (db) => {
    await assertVisitOwner(db, actor.id, await visitOfPrescription(db, await prescriptionOfItem(db, itemId)));
    await db.query('DELETE FROM prescription_items WHERE item_id = $1', [itemId]);
    return { ok: true };
  });
});
