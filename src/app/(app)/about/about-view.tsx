'use client';

import { Check, Minus } from 'lucide-react';
import { Badge, PageHeader, Panel, table, type Tone } from '@/components/ui';

const TEAM = [
  { name: 'Kshitij Gupta', srn: 'PES1UG24AM915' },
  { name: 'Avinash MJ', srn: 'PES1UG24AM347' },
];

const FEATURES: { concept: string; where: string; objects: string; tone: Tone }[] = [
  {
    concept: 'Transactions',
    where: 'Booking, recording a consultation (visit + prescription + labs), creating a user with a profile',
    objects: 'BEGIN / COMMIT / ROLLBACK, SELECT … FOR UPDATE row locks, transaction-local set_config',
    tone: 'core',
  },
  {
    concept: 'Stored procedures',
    where: 'Appointment booking, visit recording, issuing a prescription from JSON',
    objects: 'sp_book_appointment, sp_record_visit, sp_issue_prescription',
    tone: 'core',
  },
  {
    concept: 'Functions',
    where: 'Free slots, interaction check, vector and hybrid search, dosing maths',
    objects: 'fn_available_slots, fn_check_interactions, fn_similar_cases, fn_search_conditions, fn_search_medications, fn_units_required, fn_age',
    tone: 'core',
  },
  {
    concept: 'Triggers',
    where: 'Every prescription line is validated, reserves stock and is audited; lab results are graded; appointment status follows a state machine',
    objects: 'trg_rx_items_validate, trg_rx_items_restock, trg_rx_items_audit, trg_lab_status, trg_appt_status_guard',
    tone: 'audit',
  },
  {
    concept: 'Views',
    where: 'Schedules, case library, patient overview, stock, department load, audit log, diagnosis statistics',
    objects: 'v_clinician_schedule, v_case_library, v_patient_overview, v_medication_stock, v_department_load, v_prescription_audit_log, mv_diagnosis_stats (materialized)',
    tone: 'core',
  },
  {
    concept: 'Indexing',
    where: 'Schedule lookups, double-booking guard, full-text, fuzzy names, nearest neighbours',
    objects: 'B-tree, partial UNIQUE uq_appt_doctor_slot, GIN (tsvector, pg_trgm), HNSW (vector_cosine_ops)',
    tone: 'vector',
  },
  {
    concept: 'Full-text search',
    where: 'Keyword half of hybrid search, command palette',
    objects: 'Generated tsvector columns with setweight, websearch / plainto_tsquery, ts_rank_cd',
    tone: 'ref',
  },
  {
    concept: 'Vector similarity search',
    where: 'Triage, medical search, RAG assistant, AI patient summary',
    objects: 'VECTOR(384) on visits, conditions_kb, medications; cosine distance <=>',
    tone: 'vector',
  },
  {
    concept: 'Integrity and security',
    where: 'Every form; the DB Lab console',
    objects: '24 CHECK constraints, 14 foreign keys with CASCADE / RESTRICT / SET NULL actions, bcrypt hashes, read-only role with column-level grants',
    tone: 'danger',
  },
];

const ROLES = ['Admin', 'Doctor', 'Patient'] as const;
const ACCESS: [string, boolean, boolean, boolean][] = [
  ['Manage users, departments, formulary stock', true, false, false],
  ['View all schedules, book for any patient', true, true, false],
  ['Write consultation notes, prescribe, order labs', false, true, false],
  ['Read clinical histories', false, true, false],
  ['Triage, medical search, AI assistant', false, true, false],
  ['Medical search over catalogues', true, true, false],
  ['Audit log and DB Lab', true, false, false],
  ['Book and cancel own appointments, read own record', false, false, true],
];

export function AboutView() {
  return (
    <>
      <PageHeader
        title="About MediTrack"
        description="A hospital records and triage platform that keeps structured clinical data and its vector embeddings in one PostgreSQL database."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Problem and approach">
          <div className="max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-2">
            <p>
              Clinicians write symptom notes in free text, so a keyword search over past records misses most relevant cases:
              “burning behind the breastbone after dinner” and “chest pain after meals” share almost no words. At the same time,
              appointments, prescriptions and lab results need the guarantees only a relational database gives: constraints,
              transactions and an audit trail.
            </p>
            <p>
              MediTrack stores both in PostgreSQL. Relational tables hold the records; pgvector columns hold 384-dimension
              embeddings of symptom notes, condition descriptions and drug indications. One SQL query can join a patient’s
              visit to its nearest neighbours by meaning, and retrieval-augmented generation answers questions using only
              those retrieved records, with citations.
            </p>
          </div>
        </Panel>

        <Panel title="Team">
          <ul className="divide-y divide-line">
            {TEAM.map((m) => (
              <li key={m.srn} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="font-semibold">{m.name}</span>
                <span className="font-mono text-sm text-ink-2">{m.srn}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-3">DBMS Experiential Learning, Level 3 project. Option 2: SQL + vector database.</p>
        </Panel>
      </div>

      <Panel title="Architecture" className="mt-6">
        <Architecture />
      </Panel>

      <Panel title="Database concepts and where to see them" className="mt-6" bodyClassName="p-0">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Concept</th>
                <th className={table.th}>Where it runs in the app</th>
                <th className={table.th}>Database objects</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.concept} className={table.row}>
                  <td className={`${table.td} whitespace-nowrap`}>
                    <Badge tone={f.tone}>{f.concept}</Badge>
                  </td>
                  <td className={`${table.td} min-w-64 text-ink-2`}>{f.where}</td>
                  <td className={`${table.td} min-w-72 font-mono text-[12.5px] text-ink`}>{f.objects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Vector design">
          <dl className="space-y-3 text-sm">
            {[
              ['Data embedded', 'Visit symptom notes, knowledge-base conditions (name + description), formulary entries (name, class, indications).'],
              ['Model', 'sentence-transformers all-MiniLM-L6-v2 via ONNX (transformers.js), running inside the Next.js server. No external API.'],
              ['Storage', 'VECTOR(384) columns next to the source rows; HNSW indexes with vector_cosine_ops.'],
              ['Metric', 'Cosine distance (<=>); embeddings are L2-normalised.'],
              ['Retrieval', 'k-nearest neighbours for cases; Reciprocal Rank Fusion of vector and full-text rankings for catalogues; filtered by a similarity floor before being passed to the language model.'],
              ['Generation', 'Ollama (local qwen2.5) by default, Claude when an Anthropic key is configured, or a retrieval-only summary when neither is available.'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-semibold text-ink">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Role-based access" description="Enforced in every API route and page, not only in the menu" bodyClassName="p-0">
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Capability</th>
                  {ROLES.map((r) => (
                    <th key={r} className={`${table.th} text-center`}>
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACCESS.map(([cap, ...flags]) => (
                  <tr key={cap} className={table.row}>
                    <td className={`${table.td} text-ink-2`}>{cap}</td>
                    {flags.map((f, i) => (
                      <td key={i} className={`${table.td} text-center`}>
                        {f ? (
                          <Check className="mx-auto size-4 text-ok" aria-label="Allowed" />
                        ) : (
                          <Minus className="mx-auto size-4 text-ink-3" aria-label="Not allowed" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Architecture() {
  const box = 'rounded-lg border px-4 py-3 text-sm';
  return (
    <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1.2fr_auto_1.4fr]">
      <div className={`${box} border-line bg-muted`}>
        <p className="font-bold">Browser</p>
        <p className="text-ink-2">Next.js React UI, role-aware pages, streaming answers over server-sent events</p>
      </div>
      <Arrow />
      <div className={`${box} border-core/30 bg-core-soft/50`}>
        <p className="font-bold">Next.js route handlers</p>
        <p className="text-ink-2">NextAuth sessions and RBAC, zod shape checks, parameterised SQL through node-postgres</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <span className="rounded-md border border-vector/30 bg-surface px-2 py-1.5 text-[12.5px]">
            <span className="font-semibold text-vector">Embeddings</span>
            <br />
            MiniLM, local ONNX
          </span>
          <span className="rounded-md border border-vector/30 bg-surface px-2 py-1.5 text-[12.5px]">
            <span className="font-semibold text-vector">Generation</span>
            <br />
            Ollama or Claude
          </span>
        </div>
      </div>
      <Arrow />
      <div className={`${box} border-line-strong bg-surface`}>
        <p className="font-bold">PostgreSQL 17</p>
        <ul className="mt-1 space-y-1 text-ink-2">
          <li>
            <span className="font-semibold text-core">Relational:</span> 13 tables, constraints, views, procedures, triggers
          </li>
          <li>
            <span className="font-semibold text-vector">pgvector:</span> VECTOR(384) columns with HNSW indexes
          </li>
          <li>
            <span className="font-semibold text-ref">Full text + trigram:</span> GIN indexes
          </li>
          <li>
            <span className="font-semibold text-audit">Audit:</span> trigger-written prescription_audit
          </li>
        </ul>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 40 16" className="mx-auto h-4 w-10 rotate-90 text-ink-3 lg:rotate-0" aria-hidden>
      <path d="M0 8 H34 M28 2 L36 8 L28 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
