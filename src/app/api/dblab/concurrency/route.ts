import { z } from 'zod';
import { getPool, query, queryOne } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';
import { ApiError } from '@/lib/errors';

interface Attempt {
  patient_id: number;
  patient_name: string;
  ok: boolean;
  appointment_id?: number;
  error?: string;
  code?: string;
  started_ms: number;
  finished_ms: number;
}

/**
 * Fires N simultaneous bookings for the SAME doctor and slot, each in its own
 * transaction on its own connection. sp_book_appointment locks the doctor row
 * (SELECT ... FOR UPDATE), so the transactions queue: exactly one commits and
 * the rest see the slot taken. The winner's row is deleted afterwards.
 */
export const POST = route(async (req) => {
  const actor = await requireActor('admin');
  const body = z
    .object({ doctor_id: z.coerce.number().int().optional(), attempts: z.coerce.number().int().min(2).max(10).default(6) })
    .parse(await readJson(req));

  const doctor = await queryOne<{ doctor_id: number; full_name: string }>(
    `SELECT d.doctor_id, u.full_name FROM doctors d JOIN users u ON u.user_id = d.doctor_id
      WHERE u.is_active AND ($1::INT IS NULL OR d.doctor_id = $1) ORDER BY d.doctor_id LIMIT 1`,
    [body.doctor_id ?? null],
  );
  if (!doctor) throw new ApiError(404, 'No active doctor found.');

  const slot = await queryOne<{ slot: Date }>(
    `SELECT s.slot
       FROM generate_series((now() AT TIME ZONE 'Asia/Kolkata')::DATE + 1,
                            (now() AT TIME ZONE 'Asia/Kolkata')::DATE + 21, INTERVAL '1 day') AS d
       CROSS JOIN LATERAL fn_available_slots($1, d::DATE) AS s
      ORDER BY s.slot LIMIT 1`,
    [doctor.doctor_id],
  );
  if (!slot) throw new ApiError(409, 'The doctor has no free slot in the next three weeks.');

  const patients = await query<{ patient_id: number; full_name: string }>(
    `SELECT p.patient_id, u.full_name FROM patients p JOIN users u ON u.user_id = p.patient_id
      WHERE u.is_active
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.patient_id AND a.status = 'scheduled'
                          AND abs(extract(epoch FROM a.scheduled_at - $1::TIMESTAMPTZ)) < 1800)
      ORDER BY random() LIMIT $2`,
    [slot.slot, body.attempts],
  );

  const t0 = performance.now();
  const results = await Promise.all(
    patients.map(async (p): Promise<Attempt> => {
      const client = await getPool().connect();
      const started_ms = performance.now() - t0;
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.user_id', $1, true)", [String(actor.id)]);
        const { rows } = await client.query<{ p_appointment_id: number }>(
          'CALL sp_book_appointment($1, $2, $3, $4, NULL)',
          [p.patient_id, doctor.doctor_id, slot.slot, 'Concurrency demo'],
        );
        // Hold the lock briefly so the competing transactions visibly queue behind it.
        await client.query('SELECT pg_sleep(0.25)');
        await client.query('COMMIT');
        return { patient_id: p.patient_id, patient_name: p.full_name, ok: true,
                 appointment_id: rows[0].p_appointment_id, started_ms, finished_ms: performance.now() - t0 };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        const e = err as { message: string; code?: string };
        return { patient_id: p.patient_id, patient_name: p.full_name, ok: false, error: e.message, code: e.code,
                 started_ms, finished_ms: performance.now() - t0 };
      } finally {
        client.release();
      }
    }),
  );

  const winners = results.filter((r) => r.ok && r.appointment_id).map((r) => r.appointment_id);
  if (winners.length) await query('DELETE FROM appointments WHERE appointment_id = ANY($1::INT[])', [winners]);
  return {
    doctor,
    slot: slot.slot,
    results: results
      .map((r) => ({ ...r, started_ms: Math.round(r.started_ms), finished_ms: Math.round(r.finished_ms) }))
      .sort((a, b) => a.finished_ms - b.finished_ms),
    committed: winners.length,
    cleaned_up: winners.length,
  };
});
