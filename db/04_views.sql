-- =====================================================================
-- MediTrack | 04_views.sql
-- Read models used by the application. Views keep the multi-table joins
-- in one place; the materialized view caches an expensive aggregate.
-- =====================================================================

-- Clinician schedule: every appointment with doctor, department and patient.
CREATE OR REPLACE VIEW v_clinician_schedule AS
SELECT a.appointment_id,
       a.scheduled_at,
       (a.scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE AS local_date,
       a.status,
       a.reason,
       a.created_at,
       a.doctor_id,
       du.full_name           AS doctor_name,
       d.specialization,
       dep.dept_id,
       dep.name               AS department,
       a.patient_id,
       pu.full_name           AS patient_name,
       fn_age(p.dob)          AS patient_age,
       p.gender               AS patient_gender,
       p.blood_group,
       p.phone                AS patient_phone,
       v.visit_id,
       v.diagnosis
FROM appointments a
JOIN doctors d      ON d.doctor_id   = a.doctor_id
JOIN users du       ON du.user_id    = d.doctor_id
JOIN departments dep ON dep.dept_id  = d.dept_id
JOIN patients p     ON p.patient_id  = a.patient_id
JOIN users pu       ON pu.user_id    = p.patient_id
LEFT JOIN visits v  ON v.appointment_id = a.appointment_id;

-- De-identified case library: what the triage search and the RAG assistant
-- read. No names or contact details, only age-at-visit and gender.
CREATE OR REPLACE VIEW v_case_library AS
SELECT v.visit_id,
       v.created_at                               AS visit_date,
       v.symptom_note,
       v.diagnosis,
       v.outcome,
       v.follow_up_date,
       fn_age(p.dob, v.created_at::DATE)          AS patient_age,
       p.gender                                   AS patient_gender,
       dep.name                                   AS department,
       du.full_name                               AS doctor_name,
       a.patient_id,
       a.doctor_id,
       (SELECT string_agg(m.name || COALESCE(' ' || m.strength, '') || ' ' || pi.dosage || ' '
                          || pi.frequency || ' x ' || pi.duration_days || 'd', '; ' ORDER BY m.name)
          FROM prescriptions pr
          JOIN prescription_items pi ON pi.prescription_id = pr.prescription_id
          JOIN medications m         ON m.medication_id    = pi.medication_id
         WHERE pr.visit_id = v.visit_id)          AS treatment,
       (SELECT string_agg(l.test_name || ' ' || trim_scale(l.result_value) || COALESCE(' ' || l.unit, '')
                          || ' (' || l.status || ')', '; ' ORDER BY l.tested_at)
          FROM lab_results l
         WHERE l.visit_id = v.visit_id)           AS labs,
       (SELECT count(*) FROM lab_results l
         WHERE l.visit_id = v.visit_id AND l.status <> 'normal')::INT AS abnormal_labs
FROM visits v
JOIN appointments a  ON a.appointment_id = v.appointment_id
JOIN patients p      ON p.patient_id     = a.patient_id
JOIN doctors d       ON d.doctor_id      = a.doctor_id
JOIN users du        ON du.user_id       = d.doctor_id
JOIN departments dep ON dep.dept_id      = d.dept_id;

-- One row per patient with visit/appointment aggregates (GROUP BY + FILTER).
CREATE OR REPLACE VIEW v_patient_overview AS
SELECT p.patient_id,
       u.full_name,
       u.email,
       u.is_active,
       p.dob,
       fn_age(p.dob)  AS age,
       p.gender,
       p.blood_group,
       p.phone,
       count(v.visit_id)                                              AS visit_count,
       max(v.created_at)                                              AS last_visit_at,
       min(a.scheduled_at) FILTER (WHERE a.status = 'scheduled' AND a.scheduled_at > now()) AS next_appointment_at,
       count(a.appointment_id) FILTER (WHERE a.status = 'no_show')   AS no_show_count
FROM patients p
JOIN users u             ON u.user_id = p.patient_id
LEFT JOIN appointments a ON a.patient_id = p.patient_id
LEFT JOIN visits v       ON v.appointment_id = a.appointment_id
GROUP BY p.patient_id, u.full_name, u.email, u.is_active;

-- Pharmacy view: stock position and 30-day dispensing per medication.
CREATE OR REPLACE VIEW v_medication_stock AS
SELECT m.medication_id,
       m.name,
       m.form,
       m.strength,
       m.drug_class,
       m.description,
       m.unit_price,
       m.stock_qty,
       m.reorder_level,
       (m.stock_qty <= m.reorder_level)                               AS low_stock,
       COALESCE(sum(fn_units_required(m.form, pi.frequency, pi.duration_days))
                FILTER (WHERE pr.issued_at > now() - INTERVAL '30 days'), 0)::INT AS units_dispensed_30d,
       count(pi.item_id)                                              AS times_prescribed
FROM medications m
LEFT JOIN prescription_items pi ON pi.medication_id   = m.medication_id
LEFT JOIN prescriptions pr      ON pr.prescription_id = pi.prescription_id
GROUP BY m.medication_id;

-- Department workload (admin dashboard).
CREATE OR REPLACE VIEW v_department_load AS
SELECT dep.dept_id,
       dep.name,
       dep.location,
       dep.description,
       count(DISTINCT d.doctor_id)                                                    AS doctor_count,
       count(a.appointment_id) FILTER (WHERE a.status = 'scheduled' AND a.scheduled_at > now()) AS upcoming_appointments,
       count(a.appointment_id) FILTER (WHERE a.status = 'completed'
                                         AND a.scheduled_at > now() - INTERVAL '90 days') AS visits_90d,
       (SELECT ROUND(avg(d2.consult_fee), 2) FROM doctors d2 WHERE d2.dept_id = dep.dept_id) AS avg_consult_fee
FROM departments dep
LEFT JOIN doctors d      ON d.dept_id   = dep.dept_id
LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
GROUP BY dep.dept_id;

-- Readable audit trail: who changed which prescription line for which patient.
CREATE OR REPLACE VIEW v_prescription_audit_log AS
SELECT pa.audit_id,
       pa.action,
       pa.changed_at,
       pa.changed_by,
       cu.full_name                                        AS changed_by_name,
       cu.role                                             AS changed_by_role,
       COALESCE(pa.item_id, (pa.old_data ->> 'item_id')::INT) AS item_id,
       (COALESCE(pa.new_data, pa.old_data) ->> 'prescription_id')::INT AS prescription_id,
       m.name                                              AS medication_name,
       pu.full_name                                        AS patient_name,
       pa.old_data,
       pa.new_data
FROM prescription_audit pa
LEFT JOIN users cu         ON cu.user_id = pa.changed_by
LEFT JOIN medications m    ON m.medication_id = (COALESCE(pa.new_data, pa.old_data) ->> 'medication_id')::INT
LEFT JOIN prescriptions pr ON pr.prescription_id = (COALESCE(pa.new_data, pa.old_data) ->> 'prescription_id')::INT
LEFT JOIN visits v         ON v.visit_id = pr.visit_id
LEFT JOIN appointments a   ON a.appointment_id = v.appointment_id
LEFT JOIN users pu         ON pu.user_id = a.patient_id;

-- Diagnosis statistics, materialized because it scans every visit.
-- Refreshed after seeding and from the DB Lab page (REFRESH ... CONCURRENTLY
-- needs the unique index below).
CREATE MATERIALIZED VIEW mv_diagnosis_stats AS
SELECT v.diagnosis,
       dep.name                                                    AS department,
       count(*)::INT                                               AS case_count,
       ROUND(avg(fn_age(p.dob, v.created_at::DATE)), 1)            AS avg_age,
       count(*) FILTER (WHERE v.outcome IN ('resolved', 'improving'))::INT AS good_outcomes,
       count(*) FILTER (WHERE v.outcome IN ('admitted', 'referred'))::INT  AS escalations,
       max(v.created_at)                                           AS last_seen
FROM visits v
JOIN appointments a  ON a.appointment_id = v.appointment_id
JOIN patients p      ON p.patient_id     = a.patient_id
JOIN doctors d       ON d.doctor_id      = a.doctor_id
JOIN departments dep ON dep.dept_id      = d.dept_id
WHERE v.diagnosis IS NOT NULL
GROUP BY v.diagnosis, dep.name;

CREATE UNIQUE INDEX uq_mv_diagnosis_stats ON mv_diagnosis_stats (diagnosis, department);
