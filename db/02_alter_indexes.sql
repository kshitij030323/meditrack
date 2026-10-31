-- =====================================================================
-- MediTrack | 02_alter_indexes.sql
-- Schema evolution with ALTER TABLE, plus every index the app relies on:
-- B-tree (FK lookups, schedules), partial unique (double-booking guard),
-- GIN (full-text + trigram) and HNSW (vector similarity).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALTER: columns the application needed after the first design pass
-- ---------------------------------------------------------------------

-- Natural-language drug search needs catalog text and its embedding.
ALTER TABLE medications
    ADD COLUMN drug_class     VARCHAR(60),
    ADD COLUMN description    TEXT,
    ADD COLUMN reorder_level  INT NOT NULL DEFAULT 50,
    ADD COLUMN med_embedding  VECTOR(384),
    ADD CONSTRAINT chk_med_reorder CHECK (reorder_level >= 0);

-- Case retrieval shows how similar past cases turned out.
ALTER TABLE visits
    ADD COLUMN outcome VARCHAR(12),
    ADD CONSTRAINT chk_visit_outcome
        CHECK (outcome IS NULL OR outcome IN ('resolved','improving','unchanged','referred','admitted'));

-- Frequencies are standard Rx codes; the stock trigger converts them to doses/day.
ALTER TABLE prescription_items
    ADD CONSTRAINT chk_item_freq CHECK (frequency IN ('OD','BD','TDS','QID','HS','SOS','STAT')),
    ADD CONSTRAINT chk_item_dosage CHECK (length(trim(dosage)) >= 1);

-- Reference ranges must be machine-readable so the lab trigger can grade results.
ALTER TABLE lab_results
    ADD CONSTRAINT chk_lab_range
        CHECK (ref_range IS NULL OR ref_range ~ '^(\d+(\.\d+)?-\d+(\.\d+)?|<\d+(\.\d+)?|>\d+(\.\d+)?)$');

ALTER TABLE departments
    ADD CONSTRAINT chk_dept_name CHECK (length(trim(name)) >= 2);

-- Full-text search: generated tsvector columns stay in sync automatically.
ALTER TABLE visits
    ADD COLUMN note_tsv tsvector GENERATED ALWAYS AS
        (to_tsvector('english', symptom_note || ' ' || coalesce(diagnosis, ''))) STORED;

ALTER TABLE conditions_kb
    ADD COLUMN kb_tsv tsvector GENERATED ALWAYS AS
        (setweight(to_tsvector('english', name), 'A') ||
         setweight(to_tsvector('english', description), 'B') ||
         setweight(to_tsvector('english', coalesce(red_flags, '')), 'C')) STORED;

ALTER TABLE medications
    ADD COLUMN med_tsv tsvector GENERATED ALWAYS AS
        (setweight(to_tsvector('english', name), 'A') ||
         setweight(to_tsvector('english', coalesce(drug_class, '')), 'B') ||
         setweight(to_tsvector('english', coalesce(description, '')), 'C')) STORED;

-- ---------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------

-- Relational schema: UNIQUE (doctor_id, scheduled_at). Implemented as a partial
-- unique index so a cancelled slot can be booked again.
CREATE UNIQUE INDEX uq_appt_doctor_slot
    ON appointments (doctor_id, scheduled_at) WHERE status <> 'cancelled';

-- B-tree indexes for FK joins and the schedule / history screens
CREATE INDEX idx_doctors_dept        ON doctors (dept_id);
CREATE INDEX idx_appt_doctor_time    ON appointments (doctor_id, scheduled_at);
CREATE INDEX idx_appt_patient_time   ON appointments (patient_id, scheduled_at DESC);
CREATE INDEX idx_appt_status_time    ON appointments (status, scheduled_at);
CREATE INDEX idx_presc_visit         ON prescriptions (visit_id);
CREATE INDEX idx_items_presc         ON prescription_items (prescription_id);
CREATE INDEX idx_items_med           ON prescription_items (medication_id);
CREATE INDEX idx_labs_visit          ON lab_results (visit_id);
CREATE INDEX idx_di_med_b            ON drug_interactions (medication_b_id);
CREATE INDEX idx_audit_changed_at    ON prescription_audit (changed_at DESC);
CREATE INDEX idx_audit_item          ON prescription_audit (item_id);
CREATE INDEX idx_users_role          ON users (role) WHERE is_active;

-- GIN indexes for full-text search
CREATE INDEX idx_visits_tsv  ON visits        USING gin (note_tsv);
CREATE INDEX idx_kb_tsv      ON conditions_kb USING gin (kb_tsv);
CREATE INDEX idx_med_tsv     ON medications   USING gin (med_tsv);

-- GIN trigram indexes for typo-tolerant name lookup (ILIKE '%...%', similarity())
CREATE INDEX idx_users_name_trgm ON users       USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_med_name_trgm   ON medications USING gin (name gin_trgm_ops);

-- HNSW approximate-nearest-neighbour indexes for cosine distance (<=>)
CREATE INDEX idx_visits_embedding ON visits        USING hnsw (note_embedding vector_cosine_ops);
CREATE INDEX idx_kb_embedding     ON conditions_kb USING hnsw (kb_embedding   vector_cosine_ops);
CREATE INDEX idx_med_embedding    ON medications   USING hnsw (med_embedding  vector_cosine_ops);
