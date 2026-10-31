import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';

export const GET = route(async () => {
  await requireActor();
  return query('SELECT * FROM v_department_load ORDER BY name');
});

const DepartmentInput = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullish(),
  location: z.string().trim().max(60).nullish(),
});

export const POST = route(async (req) => {
  await requireActor('admin');
  const body = DepartmentInput.parse(await readJson(req));
  return queryOne(
    `INSERT INTO departments (name, description, location) VALUES ($1, $2, $3) RETURNING *`,
    [body.name, body.description || null, body.location || null],
  );
});
