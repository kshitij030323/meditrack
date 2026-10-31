-- =====================================================================
-- MediTrack | 03_functions_triggers.sql
-- Business rules enforced inside the database:
--   * helper + search functions (incl. vector and hybrid search)
--   * stored procedures for atomic multi-table operations
--   * triggers for validation, stock control and the prescription audit log
--
-- Custom SQLSTATEs raised here (mapped to HTTP codes by the API):
--   MT409  conflict (slot already taken)
--   MT422  business-rule violation (bad time, severe interaction, no stock, ...)
--   MT403  acting user is not allowed to touch this row
--   MT404  referenced row not found
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_age(p_dob DATE, p_on DATE DEFAULT CURRENT_DATE)
RETURNS INT LANGUAGE sql STABLE AS $$
    SELECT EXTRACT(YEAR FROM age(p_on, p_dob))::INT;
$$;

-- The API runs `SELECT set_config('app.user_id', <id>, true)` at the start of
-- each write transaction so triggers know who made the change.
CREATE OR REPLACE FUNCTION fn_current_user_id()
RETURNS INT LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')::INT;
$$;

CREATE OR REPLACE FUNCTION fn_doses_per_day(p_frequency TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE upper(p_frequency)
               WHEN 'OD'  THEN 1 WHEN 'BD'  THEN 2 WHEN 'TDS' THEN 3
               WHEN 'QID' THEN 4 WHEN 'HS'  THEN 1 WHEN 'SOS' THEN 1
               ELSE 1
           END;
$$;

-- Units to dispense for one prescription line: solid doses and injections are
-- counted per dose; syrups, drops and ointments are one pack per line.
CREATE OR REPLACE FUNCTION fn_units_required(p_form TEXT, p_frequency TEXT, p_days INT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
               WHEN upper(p_frequency) = 'STAT' THEN 1
               WHEN p_form IN ('tablet', 'capsule', 'injection')
                   THEN CEIL(fn_doses_per_day(p_frequency) * p_days)::INT
               ELSE 1
           END;
$$;

-- All known interactions among a set of medications, worst first.
CREATE OR REPLACE FUNCTION fn_check_interactions(p_med_ids INT[])
RETURNS TABLE (interaction_id INT, medication_a_id INT, medication_a TEXT,
               medication_b_id INT, medication_b TEXT, severity severity_t, description TEXT)
LANGUAGE sql STABLE AS $$
    SELECT di.interaction_id, ma.medication_id, ma.name, mb.medication_id, mb.name,
           di.severity, di.description
    FROM drug_interactions di
    JOIN medications ma ON ma.medication_id = di.medication_a_id
    JOIN medications mb ON mb.medication_id = di.medication_b_id
    WHERE di.medication_a_id = ANY (p_med_ids)
      AND di.medication_b_id = ANY (p_med_ids)
    ORDER BY CASE di.severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END;
$$;

-- Free 30-minute slots for a doctor on a given day (clinic time, Asia/Kolkata).
-- Consultation hours 09:00-13:00 and 14:00-17:00, closed on Sundays.
CREATE OR REPLACE FUNCTION fn_available_slots(p_doctor_id INT, p_day DATE)
RETURNS TABLE (slot TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$
    SELECT s AT TIME ZONE 'Asia/Kolkata'
    FROM generate_series(p_day + TIME '09:00', p_day + TIME '16:30', INTERVAL '30 minutes') AS s
    WHERE EXTRACT(ISODOW FROM p_day) <> 7
      AND NOT (s::TIME >= TIME '13:00' AND s::TIME < TIME '14:00')
      AND (s AT TIME ZONE 'Asia/Kolkata') > now()
      AND NOT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.doctor_id = p_doctor_id
              AND a.status <> 'cancelled'
              AND a.scheduled_at > (s AT TIME ZONE 'Asia/Kolkata') - INTERVAL '30 minutes'
              AND a.scheduled_at < (s AT TIME ZONE 'Asia/Kolkata') + INTERVAL '30 minutes')
    ORDER BY 1;
$$;

-- ---------------------------------------------------------------------
-- Vector + hybrid search
-- Cosine distance `<=>` ranges 0..2; similarity = 1 - distance.
-- ---------------------------------------------------------------------

-- k nearest historical visits to a symptom-note embedding (uses HNSW index).
CREATE OR REPLACE FUNCTION fn_similar_cases(p_embedding vector, p_k INT DEFAULT 8,
                                            p_exclude_visit INT DEFAULT NULL)
RETURNS TABLE (visit_id INT, similarity NUMERIC)
LANGUAGE sql STABLE AS $$
    SELECT v.visit_id, ROUND((1 - (v.note_embedding <=> p_embedding))::NUMERIC, 4)
    FROM visits v
    WHERE v.note_embedding IS NOT NULL
      AND v.visit_id IS DISTINCT FROM p_exclude_visit
    ORDER BY v.note_embedding <=> p_embedding
    LIMIT p_k;
$$;

-- Hybrid retrieval over the condition knowledge base. Semantic ranking
-- (pgvector) and keyword ranking (tsvector, OR-ed terms) are fused with
-- Reciprocal Rank Fusion: score = sum(1 / (60 + rank)).
-- p_mode: 'hybrid' | 'semantic' | 'keyword'
CREATE OR REPLACE FUNCTION fn_search_conditions(p_embedding vector, p_query TEXT,
                                                p_mode TEXT DEFAULT 'hybrid', p_k INT DEFAULT 10)
RETURNS TABLE (condition_id INT, semantic_rank INT, keyword_rank INT,
               similarity NUMERIC, keyword_score NUMERIC, score NUMERIC)
LANGUAGE sql STABLE AS $$
    WITH q AS (
        SELECT replace(plainto_tsquery('english', coalesce(p_query, ''))::TEXT, ' & ', ' | ')::tsquery AS tsq
    ),
    sem AS (
        SELECT c.condition_id,
               1 - (c.kb_embedding <=> p_embedding) AS sim,
               ROW_NUMBER() OVER (ORDER BY c.kb_embedding <=> p_embedding) AS rnk
        FROM conditions_kb c
        WHERE p_mode IN ('hybrid', 'semantic') AND p_embedding IS NOT NULL AND c.kb_embedding IS NOT NULL
        ORDER BY c.kb_embedding <=> p_embedding
        LIMIT 40
    ),
    kw AS (
        SELECT c.condition_id,
               ts_rank_cd(c.kb_tsv, q.tsq) AS kscore,
               ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.kb_tsv, q.tsq) DESC) AS rnk
        FROM conditions_kb c, q
        WHERE p_mode IN ('hybrid', 'keyword') AND c.kb_tsv @@ q.tsq
        ORDER BY kscore DESC
        LIMIT 40
    )
    SELECT COALESCE(s.condition_id, k.condition_id),
           s.rnk::INT, k.rnk::INT,
           ROUND(s.sim::NUMERIC, 4), ROUND(k.kscore::NUMERIC, 4),
           ROUND((COALESCE(1.0 / (60 + s.rnk), 0) + COALESCE(1.0 / (60 + k.rnk), 0))::NUMERIC, 6) AS score
    FROM sem s
    FULL OUTER JOIN kw k ON k.condition_id = s.condition_id
    ORDER BY score DESC, s.sim DESC NULLS LAST
    LIMIT p_k;
$$;

-- Same fusion over the medication catalog.
CREATE OR REPLACE FUNCTION fn_search_medications(p_embedding vector, p_query TEXT,
                                                 p_mode TEXT DEFAULT 'hybrid', p_k INT DEFAULT 10)
RETURNS TABLE (medication_id INT, semantic_rank INT, keyword_rank INT,
               similarity NUMERIC, keyword_score NUMERIC, score NUMERIC)
LANGUAGE sql STABLE AS $$
    WITH q AS (
        SELECT replace(plainto_tsquery('english', coalesce(p_query, ''))::TEXT, ' & ', ' | ')::tsquery AS tsq
    ),
    sem AS (
        SELECT m.medication_id,
               1 - (m.med_embedding <=> p_embedding) AS sim,
               ROW_NUMBER() OVER (ORDER BY m.med_embedding <=> p_embedding) AS rnk
        FROM medications m
        WHERE p_mode IN ('hybrid', 'semantic') AND p_embedding IS NOT NULL AND m.med_embedding IS NOT NULL
        ORDER BY m.med_embedding <=> p_embedding
        LIMIT 40
    ),
    kw AS (
        SELECT m.medication_id,
               ts_rank_cd(m.med_tsv, q.tsq) AS kscore,
               ROW_NUMBER() OVER (ORDER BY ts_rank_cd(m.med_tsv, q.tsq) DESC) AS rnk
        FROM medications m, q
        WHERE p_mode IN ('hybrid', 'keyword') AND m.med_tsv @@ q.tsq
        ORDER BY kscore DESC
        LIMIT 40
    )
    SELECT COALESCE(s.medication_id, k.medication_id),
           s.rnk::INT, k.rnk::INT,
           ROUND(s.sim::NUMERIC, 4), ROUND(k.kscore::NUMERIC, 4),
           ROUND((COALESCE(1.0 / (60 + s.rnk), 0) + COALESCE(1.0 / (60 + k.rnk), 0))::NUMERIC, 6) AS score
    FROM sem s
    FULL OUTER JOIN kw k ON k.medication_id = s.medication_id
    ORDER BY score DESC, s.sim DESC NULLS LAST
    LIMIT p_k;
$$;

-- ---------------------------------------------------------------------
-- Stored procedures (each runs inside the caller's transaction, so a
-- failure anywhere rolls back every row it touched)
-- ---------------------------------------------------------------------

-- Atomic appointment booking. Locking the doctor row (and patient row)
-- serialises concurrent bookings, so the check-then-insert cannot race.
CREATE OR REPLACE PROCEDURE sp_book_appointment(
    p_patient_id INT, p_doctor_id INT, p_at TIMESTAMPTZ, p_reason TEXT,
    INOUT p_appointment_id INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    v_local TIMESTAMP := p_at AT TIME ZONE 'Asia/Kolkata';
BEGIN
    IF p_at <= now() THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'Appointments must be booked for a future time.';
    END IF;
    IF EXTRACT(MINUTE FROM v_local)::INT % 15 <> 0 OR EXTRACT(SECOND FROM v_local) <> 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'Appointments start on a 15-minute boundary.';
    END IF;
    IF EXTRACT(ISODOW FROM v_local) = 7 THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'The clinic is closed on Sundays.';
    END IF;
    IF v_local::TIME < TIME '09:00' OR v_local::TIME >= TIME '17:00'
       OR (v_local::TIME >= TIME '13:00' AND v_local::TIME < TIME '14:00') THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422',
            MESSAGE = 'That time is outside consultation hours (09:00-13:00 and 14:00-17:00).';
    END IF;

    PERFORM 1 FROM doctors d JOIN users u ON u.user_id = d.doctor_id
    WHERE d.doctor_id = p_doctor_id AND u.is_active
    FOR UPDATE OF d;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT404', MESSAGE = 'Doctor not found or no longer active.';
    END IF;

    PERFORM 1 FROM patients p JOIN users u ON u.user_id = p.patient_id
    WHERE p.patient_id = p_patient_id AND u.is_active
    FOR UPDATE OF p;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT404', MESSAGE = 'Patient not found or no longer active.';
    END IF;

    IF EXISTS (SELECT 1 FROM appointments
               WHERE doctor_id = p_doctor_id AND status <> 'cancelled'
                 AND scheduled_at > p_at - INTERVAL '30 minutes'
                 AND scheduled_at < p_at + INTERVAL '30 minutes') THEN
        RAISE EXCEPTION USING ERRCODE = 'MT409', MESSAGE = 'This slot is already booked for the doctor.',
            HINT = 'Pick another free slot.';
    END IF;

    IF EXISTS (SELECT 1 FROM appointments
               WHERE patient_id = p_patient_id AND status = 'scheduled'
                 AND scheduled_at > p_at - INTERVAL '30 minutes'
                 AND scheduled_at < p_at + INTERVAL '30 minutes') THEN
        RAISE EXCEPTION USING ERRCODE = 'MT409',
            MESSAGE = 'The patient already has an appointment within 30 minutes of this time.';
    END IF;

    INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason)
    VALUES (p_patient_id, p_doctor_id, p_at, NULLIF(trim(p_reason), ''))
    RETURNING appointment_id INTO p_appointment_id;
END;
$$;

-- Records the consultation for an appointment and marks it completed.
CREATE OR REPLACE PROCEDURE sp_record_visit(
    p_appointment_id INT, p_doctor_id INT, p_note TEXT, p_embedding vector,
    p_diagnosis TEXT, p_follow_up DATE, p_outcome TEXT,
    INOUT p_visit_id INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    v_appt appointments%ROWTYPE;
BEGIN
    SELECT * INTO v_appt FROM appointments WHERE appointment_id = p_appointment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT404', MESSAGE = 'Appointment not found.';
    END IF;
    IF v_appt.doctor_id <> p_doctor_id THEN
        RAISE EXCEPTION USING ERRCODE = 'MT403', MESSAGE = 'This appointment belongs to another doctor.';
    END IF;
    IF v_appt.status <> 'scheduled' THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422',
            MESSAGE = format('Only scheduled appointments can be completed (this one is %s).', v_appt.status);
    END IF;
    IF (v_appt.scheduled_at AT TIME ZONE 'Asia/Kolkata')::DATE > (now() AT TIME ZONE 'Asia/Kolkata')::DATE THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'A visit cannot be recorded before the appointment day.';
    END IF;

    INSERT INTO visits (appointment_id, symptom_note, note_embedding, diagnosis, follow_up_date, outcome)
    VALUES (p_appointment_id, p_note, p_embedding, NULLIF(trim(p_diagnosis), ''), p_follow_up, p_outcome)
    RETURNING visit_id INTO p_visit_id;

    UPDATE appointments SET status = 'completed' WHERE appointment_id = p_appointment_id;
END;
$$;

-- Creates a prescription and its line items from a JSON array:
-- [{"medication_id": 3, "dosage": "40 mg", "frequency": "OD", "duration_days": 14}, ...]
-- Each item passes through the validation, stock and audit triggers below.
CREATE OR REPLACE PROCEDURE sp_issue_prescription(
    p_visit_id INT, p_notes TEXT, p_items JSONB,
    INOUT p_prescription_id INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    v_item JSONB;
BEGIN
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'A prescription needs at least one medication.';
    END IF;
    PERFORM 1 FROM visits WHERE visit_id = p_visit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT404', MESSAGE = 'Visit not found.';
    END IF;

    INSERT INTO prescriptions (visit_id, notes)
    VALUES (p_visit_id, NULLIF(trim(p_notes), ''))
    RETURNING prescription_id INTO p_prescription_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days)
        VALUES (p_prescription_id,
                (v_item ->> 'medication_id')::INT,
                v_item ->> 'dosage',
                upper(v_item ->> 'frequency'),
                (v_item ->> 'duration_days')::SMALLINT);
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- Triggers: prescription items
-- ---------------------------------------------------------------------

-- BEFORE INSERT/UPDATE: blocks severe interactions inside one prescription and
-- reserves stock (the CHECK stock_qty >= 0 is the last line of defence).
CREATE OR REPLACE FUNCTION trg_fn_rx_item_validate()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_med       medications%ROWTYPE;
    v_conflict  RECORD;
    v_units     INT;
    v_returned  INT := 0;
BEGIN
    SELECT * INTO v_med FROM medications WHERE medication_id = NEW.medication_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT404', MESSAGE = format('Medication #%s does not exist.', NEW.medication_id);
    END IF;

    SELECT m.name AS other_name, di.description INTO v_conflict
    FROM prescription_items pi
    JOIN drug_interactions di
      ON di.medication_a_id = LEAST(pi.medication_id, NEW.medication_id)
     AND di.medication_b_id = GREATEST(pi.medication_id, NEW.medication_id)
    JOIN medications m ON m.medication_id = pi.medication_id
    WHERE pi.prescription_id = NEW.prescription_id
      AND pi.item_id IS DISTINCT FROM NEW.item_id
      AND di.severity = 'severe'
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422',
            MESSAGE = format('Severe interaction: %s cannot be prescribed with %s.', v_med.name, v_conflict.other_name),
            DETAIL  = v_conflict.description,
            HINT    = 'Choose an alternative medication.';
    END IF;

    v_units := fn_units_required(v_med.form, NEW.frequency, NEW.duration_days);

    IF TG_OP = 'UPDATE' THEN
        IF OLD.medication_id = NEW.medication_id THEN
            v_returned := fn_units_required(v_med.form, OLD.frequency, OLD.duration_days);
        ELSE
            UPDATE medications m
               SET stock_qty = m.stock_qty + fn_units_required(m.form, OLD.frequency, OLD.duration_days)
             WHERE m.medication_id = OLD.medication_id;
        END IF;
    END IF;

    IF v_med.stock_qty + v_returned < v_units THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422',
            MESSAGE = format('Insufficient stock for %s: %s units needed, %s in stock.',
                             v_med.name, v_units, v_med.stock_qty + v_returned),
            HINT = 'Shorten the course or ask pharmacy to restock.';
    END IF;

    UPDATE medications SET stock_qty = stock_qty - v_units + v_returned
     WHERE medication_id = NEW.medication_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rx_items_validate
    BEFORE INSERT OR UPDATE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION trg_fn_rx_item_validate();

-- AFTER DELETE: return the reserved units to stock.
CREATE OR REPLACE FUNCTION trg_fn_rx_item_restock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE medications m
       SET stock_qty = m.stock_qty + fn_units_required(m.form, OLD.frequency, OLD.duration_days)
     WHERE m.medication_id = OLD.medication_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_rx_items_restock
    AFTER DELETE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION trg_fn_rx_item_restock();

-- AFTER INSERT/UPDATE/DELETE: append-only audit trail with before/after images.
-- On DELETE the item row is already gone, so item_id is stored as NULL and the
-- original id survives inside old_data.
CREATE OR REPLACE FUNCTION trg_fn_rx_item_audit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO prescription_audit (item_id, action, old_data, new_data, changed_by)
        VALUES (NEW.item_id, 'INSERT', NULL, to_jsonb(NEW), fn_current_user_id());
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.*) IS DISTINCT FROM (NEW.*) THEN
            INSERT INTO prescription_audit (item_id, action, old_data, new_data, changed_by)
            VALUES (NEW.item_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), fn_current_user_id());
        END IF;
    ELSE
        INSERT INTO prescription_audit (item_id, action, old_data, new_data, changed_by)
        VALUES (NULL, 'DELETE', to_jsonb(OLD), NULL, fn_current_user_id());
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_rx_items_audit
    AFTER INSERT OR UPDATE OR DELETE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION trg_fn_rx_item_audit();

-- ---------------------------------------------------------------------
-- Triggers: lab results and appointments
-- ---------------------------------------------------------------------

-- BEFORE INSERT/UPDATE: grade a result against its reference range.
-- Outside the range -> abnormal; beyond 2x the upper / below 0.6x the lower
-- limit -> critical.
CREATE OR REPLACE FUNCTION trg_fn_lab_status()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_lo NUMERIC;
    v_hi NUMERIC;
    v_m  TEXT[];
BEGIN
    IF NEW.ref_range IS NULL THEN
        RETURN NEW;
    END IF;
    v_m := regexp_match(NEW.ref_range, '^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$');
    IF v_m IS NOT NULL THEN
        v_lo := v_m[1]::NUMERIC;
        v_hi := v_m[2]::NUMERIC;
    ELSIF left(NEW.ref_range, 1) = '<' THEN
        v_hi := substr(NEW.ref_range, 2)::NUMERIC;
    ELSIF left(NEW.ref_range, 1) = '>' THEN
        v_lo := substr(NEW.ref_range, 2)::NUMERIC;
    END IF;

    NEW.status := CASE
        WHEN (v_hi IS NOT NULL AND NEW.result_value > v_hi * 2)
          OR (v_lo IS NOT NULL AND NEW.result_value < v_lo * 0.6) THEN 'critical'
        WHEN (v_hi IS NOT NULL AND NEW.result_value > v_hi)
          OR (v_lo IS NOT NULL AND NEW.result_value < v_lo) THEN 'abnormal'
        ELSE 'normal'
    END::lab_status;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lab_status
    BEFORE INSERT OR UPDATE OF result_value, ref_range ON lab_results
    FOR EACH ROW EXECUTE FUNCTION trg_fn_lab_status();

-- BEFORE UPDATE: appointment status state machine.
--   scheduled -> completed (only once a visit exists) | cancelled | no_show (only after the time)
--   completed / cancelled / no_show are final.
CREATE OR REPLACE FUNCTION trg_fn_appt_status_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    IF OLD.status <> 'scheduled' THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422',
            MESSAGE = format('A %s appointment cannot change status.', OLD.status);
    END IF;
    IF NEW.status = 'no_show' AND NEW.scheduled_at > now() THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'Only past appointments can be marked as no-show.';
    END IF;
    IF NEW.status = 'completed'
       AND NOT EXISTS (SELECT 1 FROM visits WHERE appointment_id = NEW.appointment_id) THEN
        RAISE EXCEPTION USING ERRCODE = 'MT422', MESSAGE = 'Record the visit to complete an appointment.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appt_status_guard
    BEFORE UPDATE OF status ON appointments
    FOR EACH ROW EXECUTE FUNCTION trg_fn_appt_status_guard();
