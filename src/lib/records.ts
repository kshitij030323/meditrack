import { query, queryOne } from './db';
import type { Actor } from './api';
import { ApiError } from './errors';

/** Visits with nested prescriptions (and their items) and lab results, newest first. */
const VISITS_SQL = `
  SELECT v.visit_id, v.created_at, v.symptom_note, v.diagnosis, v.follow_up_date, v.outcome,
         s.appointment_id, s.patient_id, s.patient_name, s.doctor_id, s.doctor_name, s.department,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'prescription_id', pr.prescription_id,
                    'issued_at', pr.issued_at,
                    'notes', pr.notes,
                    'items', COALESCE((
                       SELECT json_agg(json_build_object(
                                'item_id', pi.item_id, 'medication_id', m.medication_id, 'name', m.name,
                                'strength', m.strength, 'form', m.form, 'dosage', pi.dosage,
                                'frequency', pi.frequency, 'duration_days', pi.duration_days) ORDER BY m.name)
                         FROM prescription_items pi
                         JOIN medications m ON m.medication_id = pi.medication_id
                        WHERE pi.prescription_id = pr.prescription_id), '[]'::json)
                  ) ORDER BY pr.issued_at)
             FROM prescriptions pr WHERE pr.visit_id = v.visit_id), '[]'::json) AS prescriptions,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'lab_result_id', l.lab_result_id, 'test_name', l.test_name, 'result_value', l.result_value,
                    'unit', l.unit, 'ref_range', l.ref_range, 'status', l.status, 'tested_at', l.tested_at)
                  ORDER BY l.tested_at, l.test_name)
             FROM lab_results l WHERE l.visit_id = v.visit_id), '[]'::json) AS labs
    FROM visits v
    JOIN v_clinician_schedule s ON s.appointment_id = v.appointment_id`;

export interface RxItem {
  item_id: number;
  medication_id: number;
  name: string;
  strength: string | null;
  form: string;
  dosage: string;
  frequency: string;
  duration_days: number;
}

export interface VisitRecord {
  visit_id: number;
  created_at: string;
  symptom_note: string;
  diagnosis: string | null;
  follow_up_date: string | null;
  outcome: string | null;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  department: string;
  prescriptions: { prescription_id: number; issued_at: string; notes: string | null; items: RxItem[] }[];
  labs: {
    lab_result_id: number;
    test_name: string;
    result_value: number;
    unit: string | null;
    ref_range: string | null;
    status: 'normal' | 'abnormal' | 'critical';
    tested_at: string;
  }[];
}

/** Doctors may open any chart; patients only their own; admins none (clinical data separation). */
export function assertCanReadPatient(actor: Actor, patientId: number) {
  if (actor.role === 'doctor') return;
  if (actor.role === 'patient' && actor.id === patientId) return;
  throw new ApiError(403, 'Clinical records are only visible to medical staff and the patient.');
}

export async function getPatientRecord(patientId: number) {
  const profile = await queryOne(
    `SELECT o.*, p.address, p.emergency_contact
       FROM v_patient_overview o JOIN patients p USING (patient_id)
      WHERE o.patient_id = $1`,
    [patientId],
  );
  if (!profile) throw new ApiError(404, 'Patient not found.');
  const [appointments, visits] = await Promise.all([
    query(
      `SELECT appointment_id, scheduled_at, status, reason, doctor_id, doctor_name, department, visit_id
         FROM v_clinician_schedule WHERE patient_id = $1 ORDER BY scheduled_at DESC`,
      [patientId],
    ),
    query<VisitRecord>(`${VISITS_SQL} WHERE s.patient_id = $1 ORDER BY v.created_at DESC`, [patientId]),
  ]);
  return { profile, appointments, visits };
}

export async function getVisit(visitId: number): Promise<VisitRecord> {
  const visit = await queryOne<VisitRecord>(`${VISITS_SQL} WHERE v.visit_id = $1`, [visitId]);
  if (!visit) throw new ApiError(404, 'Visit not found.');
  return visit;
}

/** The record as plain text for the patient-summary prompt, one [V#] block per visit. */
export function recordContext(visits: VisitRecord[]): string {
  return visits
    .map((v, i) => {
      const meds = v.prescriptions
        .flatMap((p) => p.items)
        .map((it) => `${it.name} ${it.dosage} ${it.frequency} x ${it.duration_days}d`)
        .join('; ');
      const labs = v.labs.map((l) => `${l.test_name} ${l.result_value}${l.unit ? ` ${l.unit}` : ''} (${l.status})`).join('; ');
      return (
        `[V${i + 1}] Visit on ${new Date(v.created_at).toISOString().slice(0, 10)} with ${v.doctor_name} (${v.department})\n` +
        `Note: ${v.symptom_note}\nDiagnosis: ${v.diagnosis ?? 'not recorded'} | Outcome: ${v.outcome ?? 'not recorded'}` +
        `${v.follow_up_date ? ` | Follow-up: ${v.follow_up_date}` : ''}\n` +
        `Medications: ${meds || 'none'}\nLabs: ${labs || 'none'}`
      );
    })
    .join('\n\n');
}
