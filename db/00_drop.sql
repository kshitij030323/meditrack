-- =====================================================================
-- MediTrack | 00_drop.sql
-- Tears down every MediTrack object so the schema can be rebuilt from
-- scratch (`npm run db:reset`). Demonstrates DROP on every object kind.
-- Order matters: dependants (views, triggers, functions) before tables,
-- tables before the enum types they use.
-- =====================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_diagnosis_stats;

DROP VIEW IF EXISTS v_prescription_audit_log;
DROP VIEW IF EXISTS v_department_load;
DROP VIEW IF EXISTS v_medication_stock;
DROP VIEW IF EXISTS v_patient_overview;
DROP VIEW IF EXISTS v_case_library;
DROP VIEW IF EXISTS v_clinician_schedule;

DROP PROCEDURE IF EXISTS sp_book_appointment;
DROP PROCEDURE IF EXISTS sp_record_visit;
DROP PROCEDURE IF EXISTS sp_issue_prescription;

DROP FUNCTION IF EXISTS fn_search_medications;
DROP FUNCTION IF EXISTS fn_search_conditions;
DROP FUNCTION IF EXISTS fn_similar_cases;
DROP FUNCTION IF EXISTS fn_available_slots;
DROP FUNCTION IF EXISTS fn_check_interactions;

-- Tables (CASCADE also removes their triggers and indexes)
DROP TABLE IF EXISTS prescription_audit CASCADE;
DROP TABLE IF EXISTS conditions_kb      CASCADE;
DROP TABLE IF EXISTS drug_interactions  CASCADE;
DROP TABLE IF EXISTS lab_results        CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions      CASCADE;
DROP TABLE IF EXISTS medications        CASCADE;
DROP TABLE IF EXISTS visits             CASCADE;
DROP TABLE IF EXISTS appointments       CASCADE;
DROP TABLE IF EXISTS patients           CASCADE;
DROP TABLE IF EXISTS doctors            CASCADE;
DROP TABLE IF EXISTS departments        CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- Trigger functions and helpers (no longer referenced once tables are gone)
DROP FUNCTION IF EXISTS trg_fn_rx_item_validate;
DROP FUNCTION IF EXISTS trg_fn_rx_item_restock;
DROP FUNCTION IF EXISTS trg_fn_rx_item_audit;
DROP FUNCTION IF EXISTS trg_fn_lab_status;
DROP FUNCTION IF EXISTS trg_fn_appt_status_guard;
DROP FUNCTION IF EXISTS fn_units_required;
DROP FUNCTION IF EXISTS fn_doses_per_day;
DROP FUNCTION IF EXISTS fn_current_user_id;
DROP FUNCTION IF EXISTS fn_age;

DROP TYPE IF EXISTS lab_status;
DROP TYPE IF EXISTS severity_t;
DROP TYPE IF EXISTS appt_status;
DROP TYPE IF EXISTS gender_t;
DROP TYPE IF EXISTS user_role;
