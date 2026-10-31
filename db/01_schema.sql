-- =====================================================================
-- MediTrack | 01_schema.sql
-- Base schema exactly as designed in the ER diagram / relational schema.
-- Later files evolve it with ALTER (02), add logic (03) and views (04).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector: VECTOR type, <=> cosine distance, HNSW
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- trigram similarity for fuzzy name search

CREATE TYPE user_role    AS ENUM ('admin', 'doctor', 'patient');
CREATE TYPE gender_t     AS ENUM ('male', 'female', 'other');
CREATE TYPE appt_status  AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE severity_t   AS ENUM ('minor', 'moderate', 'severe');
CREATE TYPE lab_status   AS ENUM ('normal', 'abnormal', 'critical');

CREATE TABLE users (
    user_id        SERIAL       PRIMARY KEY,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    role           user_role    NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_email  CHECK (email = lower(email) AND email LIKE '%_@_%._%'),
    CONSTRAINT chk_users_name   CHECK (length(trim(full_name)) >= 2),
    CONSTRAINT chk_users_hash   CHECK (length(password_hash) >= 20)
);

CREATE TABLE departments (
    dept_id      SERIAL       PRIMARY KEY,
    name         VARCHAR(80)  NOT NULL UNIQUE,
    description  TEXT,
    location     VARCHAR(60)
);

CREATE TABLE doctors (
    doctor_id       INT          PRIMARY KEY
                                 REFERENCES users(user_id) ON DELETE CASCADE,
    dept_id         INT          NOT NULL
                                 REFERENCES departments(dept_id) ON DELETE RESTRICT,
    license_no      VARCHAR(40)  NOT NULL UNIQUE,
    specialization  VARCHAR(80)  NOT NULL,
    consult_fee     NUMERIC(8,2) NOT NULL DEFAULT 0,
    years_exp       SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT chk_doc_fee  CHECK (consult_fee >= 0 AND consult_fee <= 100000),
    CONSTRAINT chk_doc_exp  CHECK (years_exp BETWEEN 0 AND 60)
);

CREATE TABLE patients (
    patient_id         INT         PRIMARY KEY
                                   REFERENCES users(user_id) ON DELETE CASCADE,
    dob                DATE        NOT NULL,
    gender             gender_t    NOT NULL,
    blood_group        VARCHAR(3),
    phone              VARCHAR(15) NOT NULL,
    address            TEXT,
    emergency_contact  VARCHAR(15),
    CONSTRAINT chk_pat_dob    CHECK (dob > DATE '1900-01-01' AND dob < CURRENT_DATE),
    CONSTRAINT chk_pat_blood  CHECK (blood_group IS NULL OR
                                     blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    CONSTRAINT chk_pat_phone  CHECK (phone ~ '^[0-9]{10}$'),
    CONSTRAINT chk_pat_ec     CHECK (emergency_contact IS NULL OR emergency_contact ~ '^[0-9]{10}$')
);

CREATE TABLE appointments (
    appointment_id  SERIAL       PRIMARY KEY,
    patient_id      INT          NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id       INT          NOT NULL REFERENCES doctors(doctor_id)  ON DELETE RESTRICT,
    scheduled_at    TIMESTAMPTZ  NOT NULL,
    status          appt_status  NOT NULL DEFAULT 'scheduled',
    reason          VARCHAR(200),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_appt_minute CHECK (EXTRACT(MINUTE FROM scheduled_at)::INT % 15 = 0)
);

CREATE TABLE visits (
    visit_id        SERIAL       PRIMARY KEY,
    appointment_id  INT          NOT NULL UNIQUE
                                 REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    symptom_note    TEXT         NOT NULL,
    note_embedding  VECTOR(384),
    diagnosis       VARCHAR(200),
    follow_up_date  DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_visit_note      CHECK (length(trim(symptom_note)) >= 10),
    CONSTRAINT chk_visit_followup  CHECK (follow_up_date IS NULL OR follow_up_date >= created_at::DATE)
);

CREATE TABLE medications (
    medication_id  SERIAL        PRIMARY KEY,
    name           VARCHAR(120)  NOT NULL UNIQUE,
    form           VARCHAR(30)   NOT NULL DEFAULT 'tablet',
    strength       VARCHAR(30),
    stock_qty      INT           NOT NULL DEFAULT 0,
    unit_price     NUMERIC(8,2)  NOT NULL DEFAULT 0,
    CONSTRAINT chk_med_stock CHECK (stock_qty >= 0),
    CONSTRAINT chk_med_price CHECK (unit_price >= 0),
    CONSTRAINT chk_med_form  CHECK (form IN ('tablet','capsule','syrup','injection','ointment','drops'))
);

CREATE TABLE prescriptions (
    prescription_id  SERIAL      PRIMARY KEY,
    visit_id         INT         NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    issued_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes            TEXT
);

CREATE TABLE prescription_items (
    item_id          SERIAL       PRIMARY KEY,
    prescription_id  INT          NOT NULL REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medication_id    INT          NOT NULL REFERENCES medications(medication_id)     ON DELETE RESTRICT,
    dosage           VARCHAR(40)  NOT NULL,
    frequency        VARCHAR(40)  NOT NULL,
    duration_days    SMALLINT     NOT NULL DEFAULT 1,
    CONSTRAINT uq_presc_med   UNIQUE (prescription_id, medication_id),
    CONSTRAINT chk_item_days  CHECK (duration_days BETWEEN 1 AND 180)
);

CREATE TABLE lab_results (
    lab_result_id  SERIAL         PRIMARY KEY,
    visit_id       INT            NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    test_name      VARCHAR(80)    NOT NULL,
    result_value   NUMERIC(10,3)  NOT NULL,
    unit           VARCHAR(20),
    ref_range      VARCHAR(40),
    status         lab_status     NOT NULL DEFAULT 'normal',
    tested_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE drug_interactions (
    interaction_id   SERIAL      PRIMARY KEY,
    medication_a_id  INT         NOT NULL REFERENCES medications(medication_id) ON DELETE CASCADE,
    medication_b_id  INT         NOT NULL REFERENCES medications(medication_id) ON DELETE CASCADE,
    severity         severity_t  NOT NULL,
    description      TEXT        NOT NULL,
    CONSTRAINT chk_di_distinct CHECK (medication_a_id < medication_b_id),
    CONSTRAINT uq_di_pair      UNIQUE (medication_a_id, medication_b_id)
);

CREATE TABLE conditions_kb (
    condition_id  SERIAL        PRIMARY KEY,
    name          VARCHAR(120)  NOT NULL UNIQUE,
    description   TEXT          NOT NULL,
    red_flags     TEXT,
    kb_embedding  VECTOR(384)
);

CREATE TABLE prescription_audit (
    audit_id    BIGSERIAL    PRIMARY KEY,
    item_id     INT          REFERENCES prescription_items(item_id) ON DELETE SET NULL,
    action      VARCHAR(10)  NOT NULL,
    old_data    JSONB,
    new_data    JSONB,
    changed_by  INT          REFERENCES users(user_id) ON DELETE SET NULL,
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT','UPDATE','DELETE'))
);
