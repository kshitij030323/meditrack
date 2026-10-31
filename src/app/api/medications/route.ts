import { query, queryOne, toVector } from '@/lib/db';
import { readJson, requireActor, route } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { MedicationInput, medicationText } from '@/lib/schemas';

export const GET = route(async (req) => {
  await requireActor('admin', 'doctor');
  const q = req.nextUrl.searchParams.get('q')?.trim() || null;
  const lowOnly = req.nextUrl.searchParams.get('low') === '1';
  return query(
    `SELECT * FROM v_medication_stock
      WHERE ($1::TEXT IS NULL OR name ILIKE '%' || $1 || '%' OR drug_class ILIKE '%' || $1 || '%'
             OR similarity(name, $1) > 0.35)
        AND (NOT $2 OR low_stock)
      ORDER BY low_stock DESC, name`,
    [q, lowOnly],
  );
});

export const POST = route(async (req) => {
  await requireActor('admin');
  const body = MedicationInput.parse(await readJson(req));
  const embedding = await embed(medicationText(body));
  return queryOne(
    `INSERT INTO medications (name, form, strength, drug_class, description, stock_qty, unit_price, reorder_level, med_embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
     RETURNING medication_id`,
    [body.name, body.form, body.strength || null, body.drug_class || null, body.description || null,
     body.stock_qty, body.unit_price, body.reorder_level, toVector(embedding)],
  );
});
