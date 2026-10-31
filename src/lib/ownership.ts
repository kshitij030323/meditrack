import type pg from 'pg';
import { ApiError } from './errors';

/** Only the doctor who recorded a visit may change it or its prescriptions. */
export async function assertVisitOwner(db: pg.PoolClient, doctorId: number, visitId: number) {
  const { rows } = await db.query<{ doctor_id: number }>(
    `SELECT a.doctor_id FROM visits v JOIN appointments a ON a.appointment_id = v.appointment_id WHERE v.visit_id = $1`,
    [visitId],
  );
  if (!rows[0]) throw new ApiError(404, 'Visit not found.');
  if (rows[0].doctor_id !== doctorId) throw new ApiError(403, 'Only the treating doctor can change this visit.');
}

export async function visitOfPrescription(db: pg.PoolClient, prescriptionId: number): Promise<number> {
  const { rows } = await db.query<{ visit_id: number }>(
    'SELECT visit_id FROM prescriptions WHERE prescription_id = $1',
    [prescriptionId],
  );
  if (!rows[0]) throw new ApiError(404, 'Prescription not found.');
  return rows[0].visit_id;
}

export async function prescriptionOfItem(db: pg.PoolClient, itemId: number): Promise<number> {
  const { rows } = await db.query<{ prescription_id: number }>(
    'SELECT prescription_id FROM prescription_items WHERE item_id = $1',
    [itemId],
  );
  if (!rows[0]) throw new ApiError(404, 'Prescription item not found.');
  return rows[0].prescription_id;
}
