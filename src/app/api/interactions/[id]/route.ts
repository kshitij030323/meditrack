import { queryOne } from '@/lib/db';
import { idParam, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

export const DELETE = route<IdParams>(async (_req, ctx) => {
  await requireActor('admin');
  const row = await queryOne('DELETE FROM drug_interactions WHERE interaction_id = $1 RETURNING interaction_id', [
    await idParam(ctx),
  ]);
  if (!row) throw new ApiError(404, 'Interaction not found.');
  return { ok: true };
});
