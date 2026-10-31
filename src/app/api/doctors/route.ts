import { query } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

export const GET = route(async (req) => {
  await requireActor();
  const deptId = req.nextUrl.searchParams.get('dept_id');
  return query(
    `SELECT d.doctor_id, u.full_name, u.email, d.specialization, d.consult_fee, d.years_exp, d.license_no,
            dep.dept_id, dep.name AS department
       FROM doctors d
       JOIN users u ON u.user_id = d.doctor_id
       JOIN departments dep ON dep.dept_id = d.dept_id
      WHERE u.is_active AND ($1::INT IS NULL OR d.dept_id = $1::INT)
      ORDER BY dep.name, u.full_name`,
    [deptId ? Number(deptId) : null],
  );
});
