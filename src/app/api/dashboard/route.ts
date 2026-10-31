import { query, queryOne } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

const TODAY = "(now() AT TIME ZONE 'Asia/Kolkata')::DATE";

export const GET = route(async () => {
  const actor = await requireActor();
  if (actor.role === 'admin') return adminDashboard();
  if (actor.role === 'doctor') return doctorDashboard(actor.id);
  return patientDashboard(actor.id);
});

async function adminDashboard() {
  const [kpis, trend, departments, diagnoses, lowStock, audit] = await Promise.all([
    queryOne(`
      SELECT (SELECT count(*) FROM patients p JOIN users u ON u.user_id = p.patient_id WHERE u.is_active) AS patients,
             (SELECT count(*) FROM doctors d JOIN users u ON u.user_id = d.doctor_id WHERE u.is_active)  AS doctors,
             (SELECT count(*) FROM appointments
               WHERE (scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE = ${TODAY} AND status <> 'cancelled') AS appointments_today,
             (SELECT count(*) FROM visits WHERE created_at > now() - INTERVAL '30 days')                  AS visits_30d,
             (SELECT count(*) FROM medications WHERE stock_qty <= reorder_level)                          AS low_stock,
             (SELECT count(*) FROM prescription_audit WHERE changed_at > now() - INTERVAL '7 days')       AS audit_7d`),
    // Daily appointment counts by status for the last 30 days and next 14 (GROUP BY + FILTER).
    query(`
      SELECT d::DATE AS day,
             count(a.appointment_id) FILTER (WHERE a.status = 'completed') AS completed,
             count(a.appointment_id) FILTER (WHERE a.status = 'scheduled') AS scheduled,
             count(a.appointment_id) FILTER (WHERE a.status = 'cancelled') AS cancelled,
             count(a.appointment_id) FILTER (WHERE a.status = 'no_show')   AS no_show
        FROM generate_series(${TODAY} - 29, ${TODAY} + 14, INTERVAL '1 day') AS d
        LEFT JOIN appointments a ON (a.scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE = d::DATE
       GROUP BY d
       ORDER BY d`),
    query(`SELECT * FROM v_department_load ORDER BY visits_90d DESC, name`),
    // Diagnoses seen at least twice (aggregate over the materialized view + HAVING).
    query(`
      SELECT diagnosis, sum(case_count)::INT AS cases, sum(escalations)::INT AS escalations
        FROM mv_diagnosis_stats
       GROUP BY diagnosis
      HAVING sum(case_count) >= 2
       ORDER BY cases DESC, diagnosis
       LIMIT 8`),
    query(`SELECT medication_id, name, strength, form, stock_qty, reorder_level
             FROM v_medication_stock WHERE low_stock ORDER BY stock_qty LIMIT 6`),
    query(`SELECT audit_id, action, changed_at, changed_by_name, medication_name, patient_name
             FROM v_prescription_audit_log ORDER BY changed_at DESC LIMIT 6`),
  ]);
  return { role: 'admin', kpis, trend, departments, diagnoses, lowStock, audit };
}

async function doctorDashboard(doctorId: number) {
  const [kpis, today, followUps, diagnoses, recent] = await Promise.all([
    queryOne(
      `SELECT count(*) FILTER (WHERE local_date = ${TODAY} AND status <> 'cancelled')               AS today_total,
              count(*) FILTER (WHERE local_date = ${TODAY} AND status = 'completed')                AS today_done,
              count(*) FILTER (WHERE status = 'scheduled' AND local_date BETWEEN ${TODAY} + 1 AND ${TODAY} + 7) AS next_7_days,
              count(DISTINCT patient_id) FILTER (WHERE status = 'completed')                        AS patients_seen
         FROM v_clinician_schedule WHERE doctor_id = $1`,
      [doctorId],
    ),
    query(
      `SELECT appointment_id, scheduled_at, status, reason, patient_id, patient_name, patient_age,
              patient_gender, blood_group, visit_id, diagnosis
         FROM v_clinician_schedule
        WHERE doctor_id = $1 AND local_date = ${TODAY} AND status <> 'cancelled'
        ORDER BY scheduled_at`,
      [doctorId],
    ),
    query(
      `SELECT v.visit_id, v.follow_up_date, v.diagnosis, s.patient_id, s.patient_name
         FROM visits v
         JOIN v_clinician_schedule s ON s.appointment_id = v.appointment_id
        WHERE s.doctor_id = $1 AND v.follow_up_date BETWEEN ${TODAY} - 3 AND ${TODAY} + 10
          AND NOT EXISTS (SELECT 1 FROM appointments a2
                           WHERE a2.patient_id = s.patient_id AND a2.status = 'scheduled'
                             AND a2.scheduled_at > now())
        ORDER BY v.follow_up_date
        LIMIT 8`,
      [doctorId],
    ),
    query(
      `SELECT diagnosis, count(*)::INT AS cases
         FROM v_case_library WHERE doctor_id = $1 AND diagnosis IS NOT NULL
        GROUP BY diagnosis ORDER BY cases DESC LIMIT 6`,
      [doctorId],
    ),
    query(
      `SELECT s.visit_id, s.scheduled_at, s.patient_id, s.patient_name, s.diagnosis
         FROM v_clinician_schedule s
        WHERE s.doctor_id = $1 AND s.status = 'completed'
        ORDER BY s.scheduled_at DESC LIMIT 6`,
      [doctorId],
    ),
  ]);
  return { role: 'doctor', kpis, today, followUps, diagnoses, recent };
}

async function patientDashboard(patientId: number) {
  const [profile, upcoming, prescriptions, labs] = await Promise.all([
    queryOne(`SELECT * FROM v_patient_overview WHERE patient_id = $1`, [patientId]),
    query(
      `SELECT appointment_id, scheduled_at, status, reason, doctor_name, specialization, department
         FROM v_clinician_schedule
        WHERE patient_id = $1 AND status = 'scheduled' AND scheduled_at > now()
        ORDER BY scheduled_at`,
      [patientId],
    ),
    query(
      `SELECT pr.prescription_id, pr.issued_at, s.doctor_name, s.diagnosis,
              json_agg(json_build_object('name', m.name, 'strength', m.strength, 'dosage', pi.dosage,
                       'frequency', pi.frequency, 'duration_days', pi.duration_days) ORDER BY m.name) AS items
         FROM prescriptions pr
         JOIN visits v ON v.visit_id = pr.visit_id
         JOIN v_clinician_schedule s ON s.appointment_id = v.appointment_id
         JOIN prescription_items pi ON pi.prescription_id = pr.prescription_id
         JOIN medications m ON m.medication_id = pi.medication_id
        WHERE s.patient_id = $1
        GROUP BY pr.prescription_id, s.doctor_name, s.diagnosis
        ORDER BY pr.issued_at DESC
        LIMIT 3`,
      [patientId],
    ),
    query(
      `SELECT l.lab_result_id, l.test_name, l.result_value, l.unit, l.ref_range, l.status, l.tested_at
         FROM lab_results l
         JOIN visits v ON v.visit_id = l.visit_id
         JOIN appointments a ON a.appointment_id = v.appointment_id
        WHERE a.patient_id = $1
        ORDER BY l.tested_at DESC LIMIT 6`,
      [patientId],
    ),
  ]);
  return { role: 'patient', profile, upcoming, prescriptions, labs };
}
