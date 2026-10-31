import { z } from 'zod';
import { queryOne, withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

interface ScheduleRow {
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  status: string;
}

async function loadFor(actorId: number, role: string, id: number) {
  const appt = await queryOne<ScheduleRow & Record<string, unknown>>(
    'SELECT * FROM v_clinician_schedule WHERE appointment_id = $1',
    [id],
  );
  if (!appt) throw new ApiError(404, 'Appointment not found.');
  if (role === 'patient' && appt.patient_id !== actorId) throw new ApiError(403, 'This is not your appointment.');
  return appt;
}

export const GET = route<IdParams>(async (_req, ctx) => {
  const actor = await requireActor();
  return loadFor(actor.id, actor.role, await idParam(ctx));
});

const StatusChange = z.object({ status: z.enum(['cancelled', 'no_show']) });

// Allowed transitions are enforced by trg_appt_status_guard in the database.
export const PATCH = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor();
  const id = await idParam(ctx);
  const { status } = StatusChange.parse(await readJson(req));
  const appt = await loadFor(actor.id, actor.role, id);
  if (actor.role === 'patient' && status !== 'cancelled') throw new ApiError(403, 'Patients can only cancel.');
  if (actor.role === 'doctor' && appt.doctor_id !== actor.id) throw new ApiError(403, 'This is another doctor’s appointment.');
  return withTransaction(actor.id, async (db) => {
    await db.query('UPDATE appointments SET status = $2 WHERE appointment_id = $1', [id, status]);
    return { ok: true };
  });
});
