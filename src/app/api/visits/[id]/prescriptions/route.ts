import { z } from 'zod';
import { withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { assertVisitOwner } from '@/lib/ownership';
import { RxItemInput } from '@/lib/schemas';

const PrescriptionInput = z.object({ notes: z.string().nullish(), items: z.array(RxItemInput).min(1) });

export const POST = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor('doctor');
  const visitId = await idParam(ctx);
  const body = PrescriptionInput.parse(await readJson(req));
  return withTransaction(actor.id, async (db) => {
    await assertVisitOwner(db, actor.id, visitId);
    const { rows } = await db.query<{ p_prescription_id: number }>(
      'CALL sp_issue_prescription($1, $2, $3::JSONB, NULL)',
      [visitId, body.notes ?? null, JSON.stringify(body.items)],
    );
    return { prescription_id: rows[0].p_prescription_id };
  });
});
