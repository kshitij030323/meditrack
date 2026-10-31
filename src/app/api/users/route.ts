import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';

export const GET = route(async (req) => {
  await requireActor('admin');
  const role = req.nextUrl.searchParams.get('role');
  const q = req.nextUrl.searchParams.get('q')?.trim() || null;
  return query(
    `SELECT u.user_id, u.email, u.full_name, u.role, u.is_active, u.created_at,
            dep.name AS department, d.dept_id, d.specialization, d.license_no, d.consult_fee, d.years_exp,
            p.dob, p.gender, p.blood_group, p.phone, p.address, p.emergency_contact
       FROM users u
       LEFT JOIN doctors d       ON d.doctor_id  = u.user_id
       LEFT JOIN departments dep ON dep.dept_id  = d.dept_id
       LEFT JOIN patients p      ON p.patient_id = u.user_id
      WHERE ($1::user_role IS NULL OR u.role = $1::user_role)
        AND ($2::TEXT IS NULL OR u.full_name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%')
      ORDER BY u.role, u.full_name`,
    [role || null, q],
  );
});

// Validation here only checks shape; value rules (phone format, fee range, DOB,
// email format, ...) are left to the database CHECK constraints on purpose.
const base = {
  email: z.string().trim(),
  full_name: z.string().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
};

const NewUser = z.discriminatedUnion('role', [
  z.object({ role: z.literal('admin'), ...base }),
  z.object({
    role: z.literal('doctor'),
    ...base,
    dept_id: z.coerce.number().int(),
    license_no: z.string().trim(),
    specialization: z.string().trim(),
    consult_fee: z.coerce.number(),
    years_exp: z.coerce.number().int(),
  }),
  z.object({
    role: z.literal('patient'),
    ...base,
    dob: z.string(),
    gender: z.enum(['male', 'female', 'other']),
    blood_group: z.string().trim().nullish(),
    phone: z.string().trim(),
    address: z.string().trim().nullish(),
    emergency_contact: z.string().trim().nullish(),
  }),
]);

export const POST = route(async (req) => {
  const actor = await requireActor('admin');
  const body = NewUser.parse(await readJson(req));
  const hash = await bcrypt.hash(body.password, 10);

  // users + role profile are inserted atomically: a failing CHECK on the
  // profile row rolls back the users row too.
  return withTransaction(actor.id, async (db) => {
    const { rows } = await db.query<{ user_id: number }>(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [body.email, hash, body.full_name, body.role],
    );
    const userId = rows[0].user_id;
    if (body.role === 'doctor') {
      await db.query(
        `INSERT INTO doctors (doctor_id, dept_id, license_no, specialization, consult_fee, years_exp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, body.dept_id, body.license_no, body.specialization, body.consult_fee, body.years_exp],
      );
    } else if (body.role === 'patient') {
      await db.query(
        `INSERT INTO patients (patient_id, dob, gender, blood_group, phone, address, emergency_contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, body.dob, body.gender, body.blood_group || null, body.phone, body.address || null,
         body.emergency_contact || null],
      );
    }
    return { user_id: userId };
  });
});
