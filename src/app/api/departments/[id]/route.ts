import { z } from 'zod';
import { queryOne } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

const DepartmentPatch = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().nullish(),
  location: z.string().trim().max(60).nullish(),
});

export const PATCH = route<IdParams>(async (req, ctx) => {
  await requireActor('admin');
  const id = await idParam(ctx);
  const body = DepartmentPatch.parse(await readJson(req));
  const row = await queryOne(
    `UPDATE departments
        SET name        = COALESCE($2, name),
            description = CASE WHEN $3::BOOLEAN THEN $4 ELSE description END,
            location    = CASE WHEN $5::BOOLEAN THEN $6 ELSE location END
      WHERE dept_id = $1
  RETURNING *`,
    [id, body.name ?? null, body.description !== undefined, body.description || null,
     body.location !== undefined, body.location || null],
  );
  if (!row) throw new ApiError(404, 'Department not found.');
  return row;
});

// ON DELETE RESTRICT on doctors.dept_id makes this fail while doctors are assigned.
export const DELETE = route<IdParams>(async (_req, ctx) => {
  await requireActor('admin');
  const id = await idParam(ctx);
  const row = await queryOne('DELETE FROM departments WHERE dept_id = $1 RETURNING dept_id', [id]);
  if (!row) throw new ApiError(404, 'Department not found.');
  return { ok: true };
});
