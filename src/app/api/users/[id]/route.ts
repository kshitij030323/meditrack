import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withTransaction } from '@/lib/db';
import { idParam, readJson, requireActor, route, type IdParams } from '@/lib/api';
import { ApiError } from '@/lib/errors';

const UserPatch = z.object({
  full_name: z.string().trim().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters.').optional(),
  // doctor profile
  dept_id: z.coerce.number().int().optional(),
  specialization: z.string().trim().optional(),
  consult_fee: z.coerce.number().optional(),
  years_exp: z.coerce.number().int().optional(),
  // patient profile
  phone: z.string().trim().optional(),
  address: z.string().trim().nullish(),
  emergency_contact: z.string().trim().nullish(),
  blood_group: z.string().trim().nullish(),
});

export const PATCH = route<IdParams>(async (req, ctx) => {
  const actor = await requireActor('admin');
  const id = await idParam(ctx);
  const body = UserPatch.parse(await readJson(req));
  if (id === actor.id && body.is_active === false) throw new ApiError(422, 'You cannot deactivate your own account.');
  const hash = body.password ? await bcrypt.hash(body.password, 10) : null;

  return withTransaction(actor.id, async (db) => {
    const { rows } = await db.query<{ role: string }>(
      `UPDATE users
          SET full_name     = COALESCE($2, full_name),
              is_active     = COALESCE($3, is_active),
              password_hash = COALESCE($4, password_hash)
        WHERE user_id = $1
    RETURNING role`,
      [id, body.full_name ?? null, body.is_active ?? null, hash],
    );
    if (!rows[0]) throw new ApiError(404, 'User not found.');
    if (rows[0].role === 'doctor') {
      await db.query(
        `UPDATE doctors
            SET dept_id        = COALESCE($2, dept_id),
                specialization = COALESCE($3, specialization),
                consult_fee    = COALESCE($4, consult_fee),
                years_exp      = COALESCE($5, years_exp)
          WHERE doctor_id = $1`,
        [id, body.dept_id ?? null, body.specialization ?? null, body.consult_fee ?? null, body.years_exp ?? null],
      );
    } else if (rows[0].role === 'patient') {
      await db.query(
        `UPDATE patients
            SET phone             = COALESCE($2, phone),
                address           = CASE WHEN $3::BOOLEAN THEN $4 ELSE address END,
                emergency_contact = CASE WHEN $5::BOOLEAN THEN $6 ELSE emergency_contact END,
                blood_group       = CASE WHEN $7::BOOLEAN THEN $8 ELSE blood_group END
          WHERE patient_id = $1`,
        [id, body.phone ?? null,
         body.address !== undefined, body.address || null,
         body.emergency_contact !== undefined, body.emergency_contact || null,
         body.blood_group !== undefined, body.blood_group || null],
      );
    }
    return { ok: true };
  });
});
