import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';
import { ApiError } from '@/lib/errors';

/**
 * Schedule listing from v_clinician_schedule, scoped by role:
 * doctors see their own column, patients their own bookings, admins everything.
 */
export const GET = route(async (req) => {
  const actor = await requireActor();
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from');
  const to = sp.get('to');
  const status = sp.get('status');
  let doctorId = sp.get('doctor_id') ? Number(sp.get('doctor_id')) : null;
  let patientId = sp.get('patient_id') ? Number(sp.get('patient_id')) : null;
  if (actor.role === 'patient') patientId = actor.id;
  if (actor.role === 'doctor' && sp.get('scope') !== 'all') doctorId = actor.id;

  return query(
    `SELECT appointment_id, scheduled_at, local_date, status, reason, created_at,
            doctor_id, doctor_name, specialization, department,
            patient_id, patient_name, patient_age, patient_gender, visit_id, diagnosis
       FROM v_clinician_schedule
      WHERE ($1::DATE IS NULL OR local_date >= $1::DATE)
        AND ($2::DATE IS NULL OR local_date <= $2::DATE)
        AND ($3::appt_status IS NULL OR status = $3::appt_status)
        AND ($4::INT IS NULL OR doctor_id = $4)
        AND ($5::INT IS NULL OR patient_id = $5)
      ORDER BY scheduled_at
      LIMIT 500`,
    [from, to, status || null, doctorId, patientId],
  );
});

const Booking = z.object({
  patient_id: z.coerce.number().int().optional(),
  doctor_id: z.coerce.number().int(),
  scheduled_at: z.string(),
  reason: z.string().trim().max(200).nullish(),
});

// Booking goes through the sp_book_appointment procedure inside a transaction.
export const POST = route(async (req) => {
  const actor = await requireActor();
  const body = Booking.parse(await readJson(req));
  const patientId = actor.role === 'patient' ? actor.id : body.patient_id;
  if (!patientId) throw new ApiError(400, 'Choose a patient.');
  return withTransaction(actor.id, async (db) => {
    const { rows } = await db.query<{ p_appointment_id: number }>(
      'CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ, $4, NULL)',
      [patientId, body.doctor_id, body.scheduled_at, body.reason ?? null],
    );
    return { appointment_id: rows[0].p_appointment_id };
  });
});
