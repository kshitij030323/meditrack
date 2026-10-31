import { query } from '@/lib/db';
import { idParam, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

export const GET = route<IdParams>(async (req, ctx) => {
  await requireActor();
  const doctorId = await idParam(ctx);
  const date = req.nextUrl.searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'Pass ?date=YYYY-MM-DD.');
  const rows = await query<{ slot: Date }>('SELECT slot FROM fn_available_slots($1, $2::DATE)', [doctorId, date]);
  return rows.map((r) => r.slot);
});
