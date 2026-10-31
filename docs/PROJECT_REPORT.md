# MediTrack: Project Report

**DBMS Experiential Learning, Level 3**
Kshitij Gupta (PES1UG24AM915), Avinash MJ (PES1UG24AM347)

---

## 1. Problem statement

Clinical notes are free text. Two notes describing the same illness rarely share words: "burning behind the
breastbone after dinner, sour taste" and "chest pain after meals" describe the same presentation, but a keyword
search links them weakly or not at all. Doctors therefore can't easily ask *"what did similar patients turn out to
have, and what worked?"*. At the same time, the operational side of a hospital (appointments, prescriptions,
stock, lab results) needs strict integrity. A double-booked slot, a dangerous drug combination or an untracked
prescription change is a real failure, not a cosmetic one.

MediTrack combines both in one PostgreSQL database. Relational tables, constraints, transactions and triggers keep
the records correct. pgvector embeddings of the free-text data make the records searchable by meaning, and they
ground an AI assistant in the hospital's own data.

## 2. Objectives

1. Implement the ER design as a normalised relational schema with database-level validation.
2. Enforce business rules in the database: atomic booking, prescription validation, stock control, audit trail
   and appointment state transitions.
3. Use vector similarity search to retrieve past cases and catalogue entries by meaning.
4. Combine keyword and vector ranking (hybrid search) and show where each wins.
5. Add retrieval-augmented generation (RAG) that answers only from retrieved records and cites them.
6. Provide a role-based Next.js interface for administrators, doctors and patients.

## 3. Scope

**In scope:** users and roles; departments and doctors; patients; appointment booking and status; consultations
(visits) with notes, diagnosis, outcome and follow-up; prescriptions with line items; lab results; the formulary
with stock and drug interactions; a condition knowledge base; the prescription audit log; semantic triage,
medical search, a RAG assistant and patient summaries.

**Out of scope:** billing and insurance, inpatient wards, imaging, HL7/FHIR integration, real clinical content. All
data is synthetic and the medical text is for demonstration only.

## 4. Functional requirements

| # | Requirement | Role |
|---|---|---|
| F1 | Sign in with email and password; sessions expire after 8 hours | All |
| F2 | Create users together with their doctor or patient profile; activate, deactivate, reset passwords | Admin |
| F3 | Manage departments (deleting one that has doctors is refused) | Admin |
| F4 | Manage formulary stock, prices, reorder levels and drug interactions | Admin |
| F5 | Book an appointment in a free 30-minute slot (no Sundays, consultation hours only, no double booking) | All (patients for themselves) |
| F6 | Cancel a booking; mark a past booking as no-show | Patient (own), doctor (own), admin |
| F7 | Record a consultation: note, diagnosis, outcome, follow-up, prescription and labs, saved atomically | Doctor |
| F8 | Warn about interactions while prescribing; refuse severe combinations; refuse when stock is insufficient | Doctor |
| F9 | Edit or delete prescription lines on one's own visits; every change is audited | Doctor |
| F10 | Find the past cases most similar to a free-text note, with diagnosis distribution and outcomes | Doctor |
| F11 | Search conditions and medications in natural language (keyword, semantic or hybrid) | Doctor, admin |
| F12 | Ask questions answered from retrieved records, with citations | Doctor |
| F13 | Generate a summary of a patient's record | Doctor |
| F14 | View one's own visits, prescriptions and lab results | Patient |
| F15 | View the audit log, the schema objects and run read-only SQL | Admin |

## 5. ER diagram

![ER diagram](er-diagram.jpg)

`USER` specialises into `DOCTOR` and `PATIENT` (disjoint, partial: administrators have no subtype). The
`VISIT ↔ CONDITION_KB` dashed link is not a foreign key: it is computed at query time by cosine similarity
between `note_embedding` and `kb_embedding`.

The diagram matches the relational schema in section 6 attribute for attribute. Foreign-key columns are
drawn as relationships, not attributes. Double lines mark total participation, meaning the foreign key is
`NOT NULL`: every doctor works in a department, every appointment has a doctor and a patient, and every visit,
prescription, prescription item and lab result has a parent. `PRESCRIPTION_ITEM` is an entity, not just the
link between a prescription and a medication, because `PRESCRIPTION_AUDIT` refers to it through `LOGS`. The
audit rows also record which `USER` made each change (`CHANGED_BY`). Both audit links are partial because
their foreign keys are `ON DELETE SET NULL`, so audit history survives deletions. `INTERACTS_WITH` stays a
recursive M:N relationship, stored in `drug_interactions`.

The editable source is `docs/er-diagram.excalidraw`; open it at excalidraw.com.

## 6. Relational schema

![Relational schema](relational-schema.jpg)

`db/01_schema.sql` creates this schema exactly as designed. `db/02_alter_indexes.sql` then evolves it with
`ALTER TABLE`:

| Change | Why |
|---|---|
| `medications` + `drug_class`, `description`, `reorder_level`, `med_embedding VECTOR(384)` | Natural-language drug search and low-stock alerts |
| `visits` + `outcome` (CHECK of 5 values) | Case retrieval shows how similar cases ended |
| Generated `tsvector` columns on `visits`, `conditions_kb`, `medications` | Full-text half of hybrid search |
| `prescription_items.frequency` CHECK (OD, BD, TDS, QID, HS, SOS, STAT) | The stock trigger converts frequency to doses per day |
| `lab_results.ref_range` CHECK (`lo-hi`, `<hi`, `>lo`) | The lab trigger can parse and grade the result |
| `UNIQUE (doctor_id, scheduled_at)` as a **partial** unique index `WHERE status <> 'cancelled'` | Blocks double booking but lets a cancelled slot be rebooked |

## 7. Database choice and justification

| Data | Nature | Store |
|---|---|---|
| Users, appointments, visits, prescriptions, labs, stock | Highly structured, relational, needs ACID and integrity | PostgreSQL tables |
| Symptom notes, condition descriptions, drug indications | Unstructured text, queried by meaning | pgvector `VECTOR(384)` columns |
| Keyword search over the same text | Exact terms, abbreviations, drug names | PostgreSQL full-text (`tsvector`, GIN) |

**Why pgvector instead of a separate vector database (Qdrant, Pinecone, Chroma)?** Each embedding belongs to a
row that already lives in PostgreSQL. Keeping it in the same row means:

- a single SQL statement can join vector neighbours to diagnoses, prescriptions and labs;
- a vector is written in the same transaction as its visit, so the vector store can never drift from the records;
- one backup, one access-control model and one connection pool cover everything;
- HNSW indexes give approximate nearest-neighbour search that is fast enough at this scale.

A separate vector database would add a synchronisation problem without adding a capability this project needs.

## 8. Data dictionary

Generated from the live database catalog (`pg_attribute`, `pg_constraint`). Enum types: `user_role` (admin,
doctor, patient), `gender_t` (male, female, other), `appt_status` (scheduled, completed, cancelled, no_show),
`severity_t` (minor, moderate, severe), `lab_status` (normal, abnormal, critical).

In total the schema has 59 constraints: 13 primary keys, 14 foreign keys, 8 UNIQUE and 24 CHECK.

#### `users`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `user_id` | integer | no | auto (sequence) | PK |
| `email` | character varying(120) | no |  | chk_users_email; UNIQUE |
| `password_hash` | character varying(255) | no |  | chk_users_hash |
| `full_name` | character varying(100) | no |  | chk_users_name |
| `role` | user_role | no |  |  |
| `is_active` | boolean | no | true |  |
| `created_at` | timestamp with time zone | no | now() |  |

#### `departments`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `dept_id` | integer | no | auto (sequence) | PK |
| `name` | character varying(80) | no |  | chk_dept_name; UNIQUE |
| `description` | text | yes |  |  |
| `location` | character varying(60) | yes |  |  |

#### `doctors`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `doctor_id` | integer | no |  | FK → users(user_id) ON DELETE CASCADE; PK |
| `dept_id` | integer | no |  | FK → departments(dept_id) ON DELETE RESTRICT |
| `license_no` | character varying(40) | no |  | UNIQUE |
| `specialization` | character varying(80) | no |  |  |
| `consult_fee` | numeric(8,2) | no | 0 | chk_doc_fee |
| `years_exp` | smallint | no | 0 | chk_doc_exp |

#### `patients`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `patient_id` | integer | no |  | FK → users(user_id) ON DELETE CASCADE; PK |
| `dob` | date | no |  | chk_pat_dob |
| `gender` | gender_t | no |  |  |
| `blood_group` | character varying(3) | yes |  | chk_pat_blood |
| `phone` | character varying(15) | no |  | chk_pat_phone |
| `address` | text | yes |  |  |
| `emergency_contact` | character varying(15) | yes |  | chk_pat_ec |

#### `appointments`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `appointment_id` | integer | no | auto (sequence) | PK |
| `patient_id` | integer | no |  | FK → patients(patient_id) ON DELETE CASCADE |
| `doctor_id` | integer | no |  | FK → doctors(doctor_id) ON DELETE RESTRICT |
| `scheduled_at` | timestamp with time zone | no |  | chk_appt_minute |
| `status` | appt_status | no | 'scheduled'::appt_status |  |
| `reason` | character varying(200) | yes |  |  |
| `created_at` | timestamp with time zone | no | now() |  |

#### `visits`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `visit_id` | integer | no | auto (sequence) | PK |
| `appointment_id` | integer | no |  | FK → appointments(appointment_id) ON DELETE CASCADE; UNIQUE |
| `symptom_note` | text | no |  | chk_visit_note |
| `note_embedding` | vector(384) | yes |  |  |
| `diagnosis` | character varying(200) | yes |  |  |
| `follow_up_date` | date | yes |  | chk_visit_followup |
| `created_at` | timestamp with time zone | no | now() | chk_visit_followup |
| `outcome` | character varying(12) | yes |  | chk_visit_outcome |
| `note_tsv` | tsvector | yes | generated tsvector |  |

#### `medications`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `medication_id` | integer | no | auto (sequence) | PK |
| `name` | character varying(120) | no |  | UNIQUE |
| `form` | character varying(30) | no | 'tablet'::character varying | chk_med_form |
| `strength` | character varying(30) | yes |  |  |
| `stock_qty` | integer | no | 0 | chk_med_stock |
| `unit_price` | numeric(8,2) | no | 0 | chk_med_price |
| `drug_class` | character varying(60) | yes |  |  |
| `description` | text | yes |  |  |
| `reorder_level` | integer | no | 50 | chk_med_reorder |
| `med_embedding` | vector(384) | yes |  |  |
| `med_tsv` | tsvector | yes | generated tsvector |  |

#### `prescriptions`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `prescription_id` | integer | no | auto (sequence) | PK |
| `visit_id` | integer | no |  | FK → visits(visit_id) ON DELETE CASCADE |
| `issued_at` | timestamp with time zone | no | now() |  |
| `notes` | text | yes |  |  |

#### `prescription_items`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `item_id` | integer | no | auto (sequence) | PK |
| `prescription_id` | integer | no |  | FK → prescriptions(prescription_id) ON DELETE CASCADE; UNIQUE |
| `medication_id` | integer | no |  | FK → medications(medication_id) ON DELETE RESTRICT; UNIQUE |
| `dosage` | character varying(40) | no |  | chk_item_dosage |
| `frequency` | character varying(40) | no |  | chk_item_freq |
| `duration_days` | smallint | no | 1 | chk_item_days |

#### `lab_results`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `lab_result_id` | integer | no | auto (sequence) | PK |
| `visit_id` | integer | no |  | FK → visits(visit_id) ON DELETE CASCADE |
| `test_name` | character varying(80) | no |  |  |
| `result_value` | numeric(10,3) | no |  |  |
| `unit` | character varying(20) | yes |  |  |
| `ref_range` | character varying(40) | yes |  | chk_lab_range |
| `status` | lab_status | no | 'normal'::lab_status |  |
| `tested_at` | timestamp with time zone | no | now() |  |

#### `drug_interactions`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `interaction_id` | integer | no | auto (sequence) | PK |
| `medication_a_id` | integer | no |  | chk_di_distinct; FK → medications(medication_id) ON DELETE CASCADE; UNIQUE |
| `medication_b_id` | integer | no |  | chk_di_distinct; FK → medications(medication_id) ON DELETE CASCADE; UNIQUE |
| `severity` | severity_t | no |  |  |
| `description` | text | no |  |  |

#### `conditions_kb`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `condition_id` | integer | no | auto (sequence) | PK |
| `name` | character varying(120) | no |  | UNIQUE |
| `description` | text | no |  |  |
| `red_flags` | text | yes |  |  |
| `kb_embedding` | vector(384) | yes |  |  |
| `kb_tsv` | tsvector | yes | generated tsvector |  |

#### `prescription_audit`

| Column | Type | Null | Default | Keys and checks |
|---|---|---|---|---|
| `audit_id` | bigint | no | auto (sequence) | PK |
| `item_id` | integer | yes |  | FK → prescription_items(item_id) ON DELETE SET NULL |
| `action` | character varying(10) | no |  | chk_audit_action |
| `old_data` | jsonb | yes |  |  |
| `new_data` | jsonb | yes |  |  |
| `changed_by` | integer | yes |  | FK → users(user_id) ON DELETE SET NULL |
| `changed_at` | timestamp with time zone | no | now() |  |

## 9. Implementation

### 9.1 SQL (DDL)

| File | Contents |
|---|---|
| `00_drop.sql` | `DROP MATERIALIZED VIEW / VIEW / PROCEDURE / FUNCTION / TABLE / TYPE`, in dependency order |
| `01_schema.sql` | `CREATE EXTENSION` (vector, pg_trgm), 5 enum types, 13 tables with their primary keys, foreign keys, UNIQUE and CHECK constraints |
| `02_alter_indexes.sql` | `ALTER TABLE` additions, 6 more CHECK constraints, 3 generated columns, 21 indexes (B-tree, partial unique, GIN full-text, GIN trigram, HNSW) |
| `03_functions_triggers.sql` | 9 functions, 3 stored procedures, 5 trigger functions and their triggers |
| `04_views.sql` | 6 views and 1 materialized view |

### 9.2 Advanced database features

| Concept | Implementation |
|---|---|
| **Transactions** | `withTransaction()` wraps each multi-statement write in BEGIN/COMMIT/ROLLBACK. Recording a visit runs `sp_record_visit`, `sp_issue_prescription` and the lab inserts in one transaction, so a severe interaction found on the second drug rolls back the visit too. |
| **Concurrency control** | `sp_book_appointment` takes `SELECT … FOR UPDATE` on the doctor and patient rows, so concurrent bookings queue. The DB Lab race shows 1 of N committing. |
| **Stored procedures** | `sp_book_appointment` (hours, Sundays, 15-minute grid, overlap checks), `sp_record_visit` (ownership, state, same-day rule), `sp_issue_prescription` (iterates a JSONB array of lines) |
| **Functions** | `fn_available_slots` (generate_series of free slots), `fn_check_interactions`, `fn_units_required`, `fn_similar_cases`, `fn_search_conditions`, `fn_search_medications`, `fn_age`, `fn_current_user_id` |
| **Triggers** | `trg_rx_items_validate` (BEFORE: severe-interaction block, stock reservation), `trg_rx_items_restock` (AFTER DELETE), `trg_rx_items_audit` (AFTER I/U/D: JSONB before/after images, actor from `app.user_id`), `trg_lab_status` (grades results), `trg_appt_status_guard` (state machine) |
| **Views** | `v_clinician_schedule` (5-table join), `v_case_library` (de-identified), `v_patient_overview` (GROUP BY + FILTER), `v_medication_stock`, `v_department_load`, `v_prescription_audit_log`, materialized `mv_diagnosis_stats` (refreshed CONCURRENTLY) |
| **Indexing** | B-tree on foreign keys and schedule columns, partial unique index, GIN on tsvector, GIN trigram on names, HNSW on all three embedding columns |
| **Full-text search** | Weighted `setweight` tsvectors, `plainto_tsquery` rewritten to OR-terms, `ts_rank_cd` |
| **Vector similarity search** | Cosine distance `<=>` over HNSW; similarity = 1 − distance |
| **Security** | bcrypt password hashes; role checks in every API route; `meditrack_reader` role with SELECT-only grants, a column-level grant that hides `users.password_hash`, read-only transactions and a statement timeout; extended query protocol to block stacked statements; credentials only in `.env.local` |

Custom SQLSTATEs make database errors explicit: `MT409` conflict, `MT422` rule violation, `MT403` not allowed,
`MT404` not found. The API maps them, and the standard codes `23505`, `23514` and `23503`, to HTTP responses that
name the constraint that fired. The UI shows that name in the error toast.

### 9.3 Vector database design

| Question | Answer |
|---|---|
| What is embedded | `visits.symptom_note`; `conditions_kb` name + description; `medications` name + class + form + indications |
| Embedding model | `all-MiniLM-L6-v2` sentence transformer (transformers.js / ONNX), run inside the Next.js server. Mean-pooled, L2-normalised. |
| How vectors are stored | `VECTOR(384)` columns on the source rows, written in the same transaction (visits) or at seed / edit time (catalogues) |
| Index | HNSW with `vector_cosine_ops` on each embedding column |
| Similarity metric | Cosine distance `<=>`; shown as similarity = 1 − distance |
| Retrieval | Cases: k-nearest neighbours (`fn_similar_cases`). Catalogues: top 40 by vector and top 40 by `ts_rank_cd`, merged with Reciprocal Rank Fusion, score = Σ 1/(60 + rank). |
| Metadata used with results | Diagnosis, outcome, age, sex, department, treatment and abnormal labs (via `v_case_library`); red flags for conditions; interactions and stock for drugs |

### 9.4 RAG pipeline

```mermaid
sequenceDiagram
  participant UI as Browser
  participant API as Route handler
  participant EMB as MiniLM (ONNX)
  participant PG as PostgreSQL + pgvector
  participant LLM as Ollama / Claude
  UI->>API: question or symptom note
  API->>EMB: embed text
  EMB-->>API: 384-d vector
  API->>PG: fn_search_conditions, fn_similar_cases, fn_search_medications
  PG-->>API: ranked records with metadata
  API-->>UI: SSE "sources" [K1..][C1..][M1..]
  API->>LLM: system rules + <context> records + question
  LLM-->>API: tokens
  API-->>UI: SSE "delta" tokens, citations rendered as chips
```

Records below a similarity floor are dropped before generation. Case records are de-identified: age, sex and
department only. With no model available, the API returns an extractive summary of the same records.

## 10. Important queries

All 22 are runnable from **DB Lab → SQL console**; the source is in `src/components/admin/sample-queries.ts`.
They cover multi-table JOINs, GROUP BY with HAVING, aggregates with FILTER, correlated subqueries and NOT EXISTS, a
window function (RANK per department), full-text and trigram search, vector and hybrid search, EXPLAIN plans, the
views, the slot and interaction functions, and the privilege check. Four representative ones follow.

**Nearest past cases for a symptom note (vector search + view join)**
```sql
SELECT cl.diagnosis, cl.outcome, cl.treatment, s.similarity
FROM fn_similar_cases($1::vector, 12) s
JOIN v_case_library cl USING (visit_id)
ORDER BY s.similarity DESC;
```

**Hybrid ranking with Reciprocal Rank Fusion (inside `fn_search_conditions`)**
```sql
WITH sem AS (SELECT condition_id, ROW_NUMBER() OVER (ORDER BY kb_embedding <=> $1) AS rnk
             FROM conditions_kb ORDER BY kb_embedding <=> $1 LIMIT 40),
     kw  AS (SELECT condition_id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(kb_tsv, q) DESC) AS rnk
             FROM conditions_kb, to_tsquery(...) q WHERE kb_tsv @@ q LIMIT 40)
SELECT COALESCE(s.condition_id, k.condition_id),
       COALESCE(1.0/(60+s.rnk),0) + COALESCE(1.0/(60+k.rnk),0) AS score
FROM sem s FULL OUTER JOIN kw k USING (condition_id)
ORDER BY score DESC;
```

**Doctors with more than 5 completed visits in six months (JOIN + GROUP BY + HAVING)**
```sql
SELECT u.full_name, dep.name AS department, count(*) AS visits
FROM visits v
JOIN appointments a ON a.appointment_id = v.appointment_id
JOIN users u ON u.user_id = a.doctor_id
JOIN doctors d ON d.doctor_id = a.doctor_id
JOIN departments dep ON dep.dept_id = d.dept_id
WHERE v.created_at > now() - INTERVAL '6 months'
GROUP BY u.full_name, dep.name
HAVING count(*) > 5
ORDER BY visits DESC;
```

**Top diagnoses per department (window function over the materialized view)**
```sql
SELECT department, diagnosis, case_count,
       RANK() OVER (PARTITION BY department ORDER BY case_count DESC) AS rank_in_department
FROM mv_diagnosis_stats;
```

## 11. System architecture

```mermaid
flowchart LR
  B[Browser<br/>Next.js React UI] -->|fetch / SSE| R[Next.js route handlers<br/>NextAuth RBAC, zod]
  R -->|parameterised SQL, pg pool| P[(PostgreSQL 17<br/>tables, constraints, procedures,<br/>triggers, views, pgvector HNSW)]
  R --> E[MiniLM embeddings<br/>ONNX, local]
  R --> L[LLM<br/>Ollama qwen2.5 / Claude]
  A[DB Lab console] -->|read-only role| P
```

- **Presentation:** React client components (TanStack Query, streaming via server-sent events). Server pages check
  the session and role before rendering.
- **API:** 35 route files under `src/app/api`. Each one calls `requireActor(...roles)`, which re-checks that the
  account is still active, and maps database errors to HTTP status codes.
- **Data:** a single `pg` pool for the app plus a least-privilege pool for the SQL console. Writes run in explicit
  transactions that set `app.user_id` so triggers can attribute changes.

## 12. Application screenshots

| | |
|---|---|
| ![](screenshots/01-login.png) Sign in with demo accounts | ![](screenshots/02-doctor-dashboard.png) Doctor dashboard and today's queue |
| ![](screenshots/03-triage-constellation-and-rag.png) Triage: case constellation and cited RAG assessment | ![](screenshots/04-search-compare-modes.png) Keyword vs semantic vs hybrid search |
| ![](screenshots/05-assistant-rag-answer.png) RAG assistant with sources | ![](screenshots/06-consultation-live-similar-cases.png) Consultation with live similar cases and interaction checks |
| ![](screenshots/07-patient-chart.png) Patient chart | ![](screenshots/09-admin-dashboard.png) Admin dashboard |
| ![](screenshots/10-db-lab-schema.png) DB Lab: schema objects | ![](screenshots/11-db-lab-sql-console.png) DB Lab: read-only SQL console |
| ![](screenshots/12-db-lab-concurrency-race.png) DB Lab: concurrent booking race | ![](screenshots/13-prescription-audit.png) Trigger-written audit log |
| ![](screenshots/14-formulary-drawer.png) Formulary and interactions | ![](screenshots/16-patient-dashboard.png) Patient portal |
| ![](screenshots/17-patient-booking.png) Booking with free slots | ![](screenshots/18-dark-mode.png) Dark mode |

## 13. Testing results

`npm test` runs 34 tests against the seeded database. Each test runs in a transaction that is rolled back; the
concurrency test cleans up after itself.

| Suite | Tests | What is verified |
|---|---|---|
| CHECK, UNIQUE and FOREIGN KEY constraints | 7 | phone, email, DOB, 15-minute grid, duplicate email, ON DELETE RESTRICT, canonical drug pair |
| sp_book_appointment | 6 | valid booking, Sunday, out of hours, 30-minute overlap (MT409), rebooking a cancelled slot, **4 concurrent transactions → exactly 1 commits** |
| Visit recording and state machine | 5 | completes the appointment, refuses another doctor (MT403), completed is final, no future no-show, short note |
| Prescription triggers | 4 | severe interaction refused, stock reserved and returned (14 tablets for BD × 7 days), insufficient stock, INSERT/UPDATE/DELETE audit attributed to the acting doctor |
| Lab grading trigger | 5 | normal, abnormal, critical (upper and lower bounds), invalid range |
| Vector and hybrid search | 3 | self-similarity ≈ 1, GERD found in keyword, semantic and hybrid modes, every row has a 384-d embedding |
| Views and security | 4 | case library is de-identified, materialized view matches source, bcrypt-only hashes, reader role cannot read hashes or write |

Result on the final build: **34 passed, 0 failed** (about 0.4 s).

Manual and API checks performed during development:

- **Authorization:** a patient opening another chart, an admin opening a clinical chart, or a doctor calling the users API all get 403. Unauthenticated calls get 401.
- **Errors:** every database rule surfaces as a readable message naming the constraint, e.g. `Rejected by CHECK chk_pat_phone (SQLSTATE 23514)`.
- **Atomicity:** a visit whose prescription hits a severe interaction leaves no visit row behind, and the appointment stays `scheduled`.
- **SQL console:** `SELECT password_hash` fails with 42501, `DELETE` fails with 25006, and `SELECT 1; DROP TABLE visits` fails with 42601.
- **Search quality:** "chest pain after meals" returns GERD, hiatal hernia, stable angina, biliary colic and gastritis. "blood thinner" returns warfarin, apixaban, clopidogrel and aspirin.

## 14. Individual contributions

> To be completed by the team: list each member's responsibilities across database design, SQL implementation,
> application development, vector search/RAG and documentation, matching the Git commit history.

| Member | SRN | Responsibilities |
|---|---|---|
| Kshitij Gupta | PES1UG24AM915 | |
| Avinash MJ | PES1UG24AM347 | |

## 15. Conclusion and future enhancements

MediTrack shows that one PostgreSQL database can be both the system of record and the semantic search engine. The
same transaction that records a visit stores its embedding. Triggers and procedures keep prescriptions, stock and
bookings consistent no matter which client writes. A single SQL statement can join "visits that read like this
note" to their diagnoses, treatments and outcomes. RAG on top of that retrieval gives answers that cite the
hospital's own records rather than general knowledge.

Future enhancements:

- **Better embeddings:** a biomedical model (e.g. a PubMedBERT-based sentence encoder) and chunked long notes.
- **Row-level security** so patient isolation is enforced by the database as well as the API.
- **Retrieval evaluation:** a labelled query set and recall@k measurements to tune the RRF constant and similarity floors.
- **Partitioning:** `visits` and `prescription_audit` by month as data grows, and `pg_cron` to refresh the materialized view.
- **Clinical integrations:** FHIR export, allergy and contraindication tables feeding the interaction trigger, and pharmacy dispensing.
