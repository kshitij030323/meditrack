import { z } from 'zod';
import { withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { assertVisitOwner } from '@/lib/ownership';
import { assertCanReadPatient, getVisit } from '@/lib/records';

export const GET = route<IdParams>(async (_req, ctx) => {
  const actor = await requireActor();
  const visit = await getVisit(await idParam(ctx));
  assertCanReadPatient(actor, visit.patient_id);
  return visit;
});

const VisitPatch = z.object({
  diagnosis: z.string().trim().nullish(),
  outcome: z.enum(['resolved', 'improving', 'unchanged', 'referred', 'admitted']).nullish(),
  follow_up_date: z.string().nullish(),
});

export const PATCH = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor('doctor');
  const id = await idParam(ctx);
  const body = VisitPatch.parse(await readJson(req));
  return withTransaction(actor.id, async (db) => {
    await assertVisitOwner(db, actor.id, id);
    await db.query(
      `UPDATE visits
          SET diagnosis      = CASE WHEN $2::BOOLEAN THEN NULLIF(trim($3), '') ELSE diagnosis END,
              outcome        = CASE WHEN $4::BOOLEAN THEN $5 ELSE outcome END,
              follow_up_date = CASE WHEN $6::BOOLEAN THEN $7::DATE ELSE follow_up_date END
        WHERE visit_id = $1`,
      [id, body.diagnosis !== undefined, body.diagnosis ?? null, body.outcome !== undefined, body.outcome ?? null,
       body.follow_up_date !== undefined, body.follow_up_date || null],
    );
    return { ok: true };
  });
});
