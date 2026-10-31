import { z } from 'zod';
import { query } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';

// Live interaction check used by the prescription builder (fn_check_interactions).
export const POST = route(async (req) => {
  await requireActor('doctor', 'admin');
  const { ids } = z.object({ ids: z.array(z.coerce.number().int()).max(30) }).parse(await readJson(req));
  if (ids.length < 2) return [];
  return query('SELECT * FROM fn_check_interactions($1::INT[])', [ids]);
});
