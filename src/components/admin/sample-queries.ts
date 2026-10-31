/**
 * "Important queries" for the DB Lab SQL console. Each runs as the read-only
 * role meditrack_reader, so only SELECT / EXPLAIN statements succeed.
 */
export interface SampleQuery {
  id: string;
  title: string;
  description: string;
  concepts: string[];
  sql: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: 'schedule-join',
    title: 'Upcoming clinic schedule',
    description: 'Five-table inner join: appointments with doctor, department and patient names.',
    concepts: ['JOIN', 'ORDER BY'],
    sql: `SELECT a.scheduled_at AT TIME ZONE 'Asia/Kolkata' AS starts_at,
       du.full_name  AS doctor,
       dep.name      AS department,
       pu.full_name  AS patient,
       a.status,
       a.reason
FROM appointments a
JOIN doctors d       ON d.doctor_id = a.doctor_id
JOIN users du        ON du.user_id  = d.doctor_id
JOIN departments dep ON dep.dept_id = d.dept_id
JOIN users pu        ON pu.user_id  = a.patient_id
WHERE a.scheduled_at >= date_trunc('day', now())
ORDER BY a.scheduled_at
LIMIT 25`,
  },
  {
    id: 'busy-doctors',
    title: 'Doctors with more than 5 visits in 6 months',
    description: 'GROUP BY with a HAVING filter on the aggregate.',
    concepts: ['GROUP BY', 'HAVING', 'COUNT'],
    sql: `SELECT u.full_name AS doctor,
       dep.name    AS department,
       count(*)    AS completed_visits,
       d.consult_fee
FROM appointments a
JOIN doctors d       ON d.doctor_id = a.doctor_id
JOIN users u         ON u.user_id   = d.doctor_id
JOIN departments dep ON dep.dept_id = d.dept_id
WHERE a.status = 'completed'
  AND a.scheduled_at > now() - INTERVAL '180 days'
GROUP BY d.doctor_id, u.full_name, dep.name, d.consult_fee
HAVING count(*) > 5
ORDER BY completed_visits DESC`,
  },
  {
    id: 'top-meds',
    title: 'Medications prescribed 3+ times',
    description: 'Course length and units dispensed per drug, using the fn_units_required helper.',
    concepts: ['GROUP BY', 'HAVING', 'AVG', 'SUM', 'Function'],
    sql: `SELECT m.name,
       m.drug_class,
       count(*)                                                   AS times_prescribed,
       round(avg(pi.duration_days), 1)                            AS avg_days,
       sum(fn_units_required(m.form, pi.frequency, pi.duration_days)) AS units_dispensed
FROM prescription_items pi
JOIN medications m ON m.medication_id = pi.medication_id
GROUP BY m.medication_id, m.name, m.drug_class
HAVING count(*) >= 3
ORDER BY times_prescribed DESC, avg_days DESC`,
  },
  {
    id: 'lab-rates',
    title: 'Out-of-range rate per lab test',
    description: 'Conditional aggregates with FILTER; status was graded by the trg_lab_status trigger.',
    concepts: ['Aggregate', 'FILTER', 'ORDER BY'],
    sql: `SELECT test_name,
       count(*)                                        AS results,
       count(*) FILTER (WHERE status = 'abnormal')     AS abnormal,
       count(*) FILTER (WHERE status = 'critical')     AS critical,
       round(100.0 * count(*) FILTER (WHERE status <> 'normal') / count(*), 1) AS pct_out_of_range
FROM lab_results
GROUP BY test_name
ORDER BY pct_out_of_range DESC, results DESC`,
  },
  {
    id: 'revenue',
    title: 'Consultation revenue by department and month',
    description: 'GROUP BY on an expression (date_trunc) with SUM over a join.',
    concepts: ['GROUP BY', 'SUM', 'date_trunc'],
    sql: `SELECT dep.name                                            AS department,
       to_char(date_trunc('month', a.scheduled_at), 'YYYY-MM') AS month,
       count(*)                                            AS visits,
       sum(d.consult_fee)                                  AS consult_revenue
FROM appointments a
JOIN doctors d       USING (doctor_id)
JOIN departments dep ON dep.dept_id = d.dept_id
WHERE a.status = 'completed'
  AND a.scheduled_at > now() - INTERVAL '6 months'
GROUP BY dep.name, date_trunc('month', a.scheduled_at)
ORDER BY month DESC, consult_revenue DESC`,
  },
  {
    id: 'lapsed-patients',
    title: 'Patients not seen in 6 months',
    description: 'Correlated NOT EXISTS subquery: had visits before, none recently.',
    concepts: ['NOT EXISTS', 'Correlated subquery', 'MAX'],
    sql: `SELECT u.full_name,
       p.phone,
       max(v.created_at)::DATE AS last_visit
FROM patients p
JOIN users u        ON u.user_id = p.patient_id
JOIN appointments a ON a.patient_id = p.patient_id
JOIN visits v       ON v.appointment_id = a.appointment_id
WHERE NOT EXISTS (
        SELECT 1
        FROM appointments a2
        JOIN visits v2 ON v2.appointment_id = a2.appointment_id
        WHERE a2.patient_id = p.patient_id
          AND v2.created_at > now() - INTERVAL '6 months')
GROUP BY u.full_name, p.phone
ORDER BY last_visit`,
  },
  {
    id: 'frequent-patients',
    title: 'Patients seen more often than average',
    description: 'HAVING compares each group with a scalar subquery over a derived table.',
    concepts: ['Subquery', 'Derived table', 'HAVING'],
    sql: `SELECT u.full_name,
       count(v.visit_id) AS visits
FROM patients p
JOIN users u        ON u.user_id = p.patient_id
JOIN appointments a ON a.patient_id = p.patient_id
JOIN visits v       ON v.appointment_id = a.appointment_id
GROUP BY u.full_name
HAVING count(v.visit_id) > (
         SELECT avg(per_patient.n)
         FROM (SELECT count(*) AS n
               FROM visits v
               JOIN appointments a USING (appointment_id)
               GROUP BY a.patient_id) AS per_patient)
ORDER BY visits DESC`,
  },
  {
    id: 'rank-diagnoses',
    title: 'Top diagnoses per department',
    description: 'Window function RANK() partitioned by department, over the materialized view.',
    concepts: ['Window function', 'Materialized view'],
    sql: `SELECT department,
       diagnosis,
       case_count,
       RANK() OVER (PARTITION BY department ORDER BY case_count DESC) AS rank_in_department
FROM mv_diagnosis_stats
ORDER BY department, rank_in_department, diagnosis`,
  },
  {
    id: 'fts',
    title: 'Full-text search over the knowledge base',
    description: 'tsvector column with a GIN index; ranked with ts_rank_cd and highlighted with ts_headline.',
    concepts: ['Full-text search', 'GIN index'],
    sql: `SELECT name,
       round(ts_rank_cd(kb_tsv, q)::NUMERIC, 3) AS rank,
       ts_headline('english', description, q, 'MaxWords=18, MinWords=8') AS excerpt
FROM conditions_kb,
     websearch_to_tsquery('english', 'chest pain or heartburn') AS q
WHERE kb_tsv @@ q
ORDER BY rank DESC
LIMIT 10`,
  },
  {
    id: 'trigram',
    title: 'Typo-tolerant name lookup',
    description: 'pg_trgm similarity with the % operator, served by a GIN trigram index.',
    concepts: ['pg_trgm', 'Fuzzy match'],
    sql: `SELECT full_name,
       role,
       round(similarity(full_name, 'Rahul Sharmaa')::NUMERIC, 3) AS similarity
FROM users
WHERE full_name % 'Rahul Sharmaa'
ORDER BY similarity DESC
LIMIT 10`,
  },
  {
    id: 'vector-cases',
    title: 'Past visits closest to a condition',
    description:
      'Vector similarity search: cosine distance (<=>) between visit-note embeddings and a knowledge-base embedding.',
    concepts: ['pgvector', 'Cosine similarity', 'HNSW'],
    sql: `WITH q AS (
  SELECT name, kb_embedding
  FROM conditions_kb
  WHERE name ILIKE '%reflux%' OR name ILIKE '%GERD%'
  LIMIT 1
)
SELECT q.name                                                  AS query_condition,
       v.visit_id,
       v.diagnosis,
       round((1 - (v.note_embedding <=> q.kb_embedding))::NUMERIC, 3) AS cosine_similarity,
       left(v.symptom_note, 90)                                AS note_excerpt
FROM q, visits v
ORDER BY v.note_embedding <=> q.kb_embedding
LIMIT 5`,
  },
  {
    id: 'hybrid',
    title: 'Hybrid search with rank fusion',
    description:
      'fn_search_conditions fuses semantic and keyword rankings with Reciprocal Rank Fusion. The first visit note is used as the query.',
    concepts: ['pgvector', 'Full-text search', 'RRF', 'Function'],
    sql: `WITH q AS (
  SELECT symptom_note, note_embedding
  FROM visits
  ORDER BY visit_id
  LIMIT 1
)
SELECT left(q.symptom_note, 60) AS query_note,
       c.name                   AS condition,
       s.semantic_rank,
       s.keyword_rank,
       s.similarity,
       s.score                  AS rrf_score
FROM q,
     fn_search_conditions(q.note_embedding, q.symptom_note, 'hybrid', 8) AS s
JOIN conditions_kb c USING (condition_id)
ORDER BY s.score DESC`,
  },
  {
    id: 'explain-vector',
    title: 'Query plan of a nearest-neighbour search',
    description:
      'EXPLAIN ANALYZE of ORDER BY <=> LIMIT. With only a few hundred rows the planner may choose a sequential scan over the HNSW index because it is cheaper; on larger tables it switches to the index scan.',
    concepts: ['EXPLAIN ANALYZE', 'HNSW', 'Indexing'],
    sql: `EXPLAIN (ANALYZE, BUFFERS)
SELECT visit_id
FROM visits
ORDER BY note_embedding <=> (SELECT kb_embedding FROM conditions_kb ORDER BY condition_id LIMIT 1)
LIMIT 5`,
  },
  {
    id: 'explain-fts',
    title: 'Query plan of a full-text match',
    description: 'EXPLAIN of a tsquery match; the GIN index idx_visits_tsv answers @@ lookups.',
    concepts: ['EXPLAIN', 'GIN index'],
    sql: `EXPLAIN (ANALYZE)
SELECT visit_id, diagnosis
FROM visits
WHERE note_tsv @@ plainto_tsquery('english', 'fever rash')`,
  },
  {
    id: 'view-cases',
    title: 'De-identified case library view',
    description: 'v_case_library joins five tables and aggregates treatment and labs with correlated subqueries.',
    concepts: ['View', 'string_agg'],
    sql: `SELECT visit_id,
       patient_age,
       patient_gender,
       department,
       diagnosis,
       outcome,
       treatment,
       labs
FROM v_case_library
ORDER BY visit_date DESC
LIMIT 15`,
  },
  {
    id: 'view-stock',
    title: 'Low-stock medications',
    description: 'v_medication_stock aggregates 30-day dispensing per drug and flags stock at or below the reorder level.',
    concepts: ['View', 'LEFT JOIN', 'FILTER'],
    sql: `SELECT name,
       strength,
       form,
       stock_qty,
       reorder_level,
       units_dispensed_30d,
       times_prescribed
FROM v_medication_stock
WHERE low_stock
ORDER BY stock_qty`,
  },
  {
    id: 'mv-stats',
    title: 'Diagnosis statistics (materialized)',
    description: 'mv_diagnosis_stats stores a precomputed aggregate; refresh it from the Transactions tab.',
    concepts: ['Materialized view'],
    sql: `SELECT diagnosis,
       department,
       case_count,
       avg_age,
       good_outcomes,
       escalations,
       last_seen::DATE
FROM mv_diagnosis_stats
ORDER BY case_count DESC
LIMIT 15`,
  },
  {
    id: 'slots',
    title: 'Free slots for a doctor tomorrow',
    description: 'Set-returning function fn_available_slots, called laterally for one doctor.',
    concepts: ['Function', 'LATERAL', 'generate_series'],
    sql: `SELECT u.full_name                         AS doctor,
       (s.slot AT TIME ZONE 'Asia/Kolkata')::TIME AS free_slot
FROM doctors d
JOIN users u ON u.user_id = d.doctor_id
CROSS JOIN LATERAL fn_available_slots(d.doctor_id, CURRENT_DATE + 1) AS s
WHERE u.email = 'ananya.rao@meditrack.in'
ORDER BY s.slot`,
  },
  {
    id: 'interactions',
    title: 'Interaction check for a drug list',
    description: 'fn_check_interactions returns every recorded interaction among the given medications, worst first.',
    concepts: ['Function', 'ARRAY', 'ANY'],
    sql: `SELECT medication_a,
       medication_b,
       severity,
       description
FROM fn_check_interactions(ARRAY(
       SELECT medication_id
       FROM medications
       WHERE name IN ('Warfarin', 'Aspirin', 'Clopidogrel', 'Omeprazole', 'Ibuprofen')))`,
  },
  {
    id: 'audit-summary',
    title: 'Audit events per user',
    description: 'Aggregates the trigger-written audit log, reading fields out of the JSONB row images.',
    concepts: ['JSONB', 'LEFT JOIN', 'GROUP BY'],
    sql: `SELECT coalesce(u.full_name, 'system') AS changed_by,
       pa.action,
       count(*)                                                       AS events,
       count(DISTINCT coalesce(pa.new_data, pa.old_data) ->> 'prescription_id') AS prescriptions
FROM prescription_audit pa
LEFT JOIN users u ON u.user_id = pa.changed_by
GROUP BY u.full_name, pa.action
ORDER BY events DESC`,
  },
  {
    id: 'triggers',
    title: 'Triggers in the schema',
    description: 'Catalog query over pg_trigger; pg_get_triggerdef rebuilds each CREATE TRIGGER statement.',
    concepts: ['System catalog', 'Triggers'],
    sql: `SELECT c.relname               AS table_name,
       t.tgname                AS trigger_name,
       p.proname               AS function_name,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p  ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
ORDER BY 1, 2`,
  },
  {
    id: 'privilege',
    title: 'Column privilege check (expected to fail)',
    description:
      'The console role was granted SELECT on every users column except password_hash, so this query is rejected.',
    concepts: ['GRANT', 'Security'],
    sql: `SELECT email, password_hash
FROM users
LIMIT 1`,
  },
];
