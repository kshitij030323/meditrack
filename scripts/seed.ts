/**
 * Seeds MediTrack with a realistic, reproducible dataset:
 *   staff and patients, the formulary, interactions, the condition knowledge
 *   base, ~18 months of completed visits (with prescriptions and labs written
 *   through the same procedures and triggers the app uses), today's clinic
 *   queue and upcoming bookings. Every visit note, condition and medication is
 *   embedded with the local MiniLM model.
 *
 * Usage: npm run db:seed   (expects a freshly migrated database: npm run db:reset)
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { embedMany } from '../src/lib/embeddings';
import { conditionText, medicationText } from '../src/lib/schemas';
import { caseTemplates } from './seed-data/cases';
import { conditions } from './seed-data/conditions';
import { departments } from './seed-data/departments';
import { doctors } from './seed-data/doctors';
import { interactions } from './seed-data/interactions';
import { medications } from './seed-data/medications';
import { patients } from './seed-data/patients';
import type { CaseTemplate } from './seed-data/types';

const DATABASE_URL = process.env.DATABASE_URL;
const PASSWORD = process.env.DEMO_PASSWORD;
if (!DATABASE_URL || !PASSWORD) throw new Error('DATABASE_URL and DEMO_PASSWORD must be set in .env.local');

const ADMINS = [
  { full_name: 'Kshitij Gupta', email: 'kshitij.gupta@meditrack.in' },
  { full_name: 'Avinash MJ', email: 'avinash.mj@meditrack.in' },
];
const DEMO_DOCTOR = 'ananya.rao@meditrack.in';
const DEMO_PATIENT = 'rahul.sharma@example.com';
const IST_OFFSET_MIN = 330;

// ---------------------------------------------------------------------------
// Deterministic randomness so every reseed produces the same hospital
// ---------------------------------------------------------------------------
let seed = 20261030;
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const intBetween = (lo: number, hi: number) => Math.floor(between(lo, hi + 1));

/** A Date for a clinic-local (IST) day offset and HH:MM. */
function istDate(dayOffset: number, hour: number, minute: number): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const utcMidnightOfIstDay = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + dayOffset);
  return new Date(utcMidnightOfIstDay + (hour * 60 + minute - IST_OFFSET_MIN) * 60_000);
}
function istWeekday(d: Date): number {
  return new Date(d.getTime() + IST_OFFSET_MIN * 60_000).getUTCDay(); // 0 = Sunday
}
const SLOTS = (() => {
  const out: [number, number][] = [];
  for (let h = 9; h < 17; h++) for (const m of [0, 30]) if (h !== 13) out.push([h, m]);
  return out;
})();

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
const q = <T extends pg.QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []) =>
  client.query<T>(text, params);
const vec = (v: number[]) => `[${v.join(',')}]`;

async function tx<T>(actorId: number | null, fn: () => Promise<T>): Promise<T> {
  await q('BEGIN');
  try {
    if (actorId) await q("SELECT set_config('app.user_id', $1, true)", [String(actorId)]);
    const out = await fn();
    await q('COMMIT');
    return out;
  } catch (err) {
    await q('ROLLBACK');
    throw err;
  }
}

const log = (msg: string) => console.log(`  • ${msg}`);
const started = Date.now();
console.log('Seeding MediTrack…');

await q(`TRUNCATE prescription_audit, lab_results, prescription_items, prescriptions, visits, appointments,
         drug_interactions, conditions_kb, medications, patients, doctors, departments, users
         RESTART IDENTITY CASCADE`);

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
async function createUser(email: string, fullName: string, role: string): Promise<number> {
  const hash = await bcrypt.hash(PASSWORD!, 10);
  const { rows } = await q<{ user_id: number }>(
    `INSERT INTO users (email, password_hash, full_name, role, created_at)
     VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::INTERVAL) RETURNING user_id`,
    [email, hash, fullName, role, String(intBetween(560, 720))],
  );
  return rows[0].user_id;
}

for (const a of ADMINS) await createUser(a.email, a.full_name, 'admin');

const deptIds = new Map<string, number>();
for (const d of departments) {
  const { rows } = await q<{ dept_id: number }>(
    'INSERT INTO departments (name, description, location) VALUES ($1, $2, $3) RETURNING dept_id',
    [d.name, d.description, d.location],
  );
  deptIds.set(d.name, rows[0].dept_id);
}

interface DoctorRec { id: number; email: string; dept: string }
const doctorRecs: DoctorRec[] = [];
for (const d of doctors) {
  const id = await createUser(d.email, d.full_name, 'doctor');
  await q(
    `INSERT INTO doctors (doctor_id, dept_id, license_no, specialization, consult_fee, years_exp)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, deptIds.get(d.dept), d.license_no, d.specialization, d.consult_fee, d.years_exp],
  );
  doctorRecs.push({ id, email: d.email, dept: d.dept });
}

interface PatientRec { id: number; email: string; age: number; gender: string }
const patientRecs: PatientRec[] = [];
for (const p of patients) {
  const id = await createUser(p.email, p.full_name, 'patient');
  await q(
    `INSERT INTO patients (patient_id, dob, gender, blood_group, phone, address, emergency_contact)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, p.dob, p.gender, p.blood_group, p.phone, p.address, p.emergency_contact],
  );
  const age = Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 86_400_000));
  patientRecs.push({ id, email: p.email, age, gender: p.gender });
}
log(`${ADMINS.length} admins, ${doctorRecs.length} doctors, ${patientRecs.length} patients`);

// ---------------------------------------------------------------------------
// Formulary, interactions and knowledge base (with embeddings)
// ---------------------------------------------------------------------------
const medVectors = await embedMany(medications.map((m) => medicationText(m)));
const medIds = new Map<string, number>();
for (const [i, m] of medications.entries()) {
  // Stock starts high so seeded prescriptions never run out; real levels are set at the end.
  const { rows } = await q<{ medication_id: number }>(
    `INSERT INTO medications (name, form, strength, stock_qty, unit_price, drug_class, description, reorder_level, med_embedding)
     VALUES ($1, $2, $3, 100000, $4, $5, $6, 40, $7::vector) RETURNING medication_id`,
    [m.name, m.form, m.strength, m.unit_price, m.drug_class, m.description, vec(medVectors[i])],
  );
  medIds.set(m.name, rows[0].medication_id);
}
for (const it of interactions) {
  await q(
    `INSERT INTO drug_interactions (medication_a_id, medication_b_id, severity, description)
     VALUES (LEAST($1::INT, $2::INT), GREATEST($1::INT, $2::INT), $3, $4)`,
    [medIds.get(it.a), medIds.get(it.b), it.severity, it.description],
  );
}
const kbVectors = await embedMany(conditions.map((c) => conditionText(c)));
for (const [i, c] of conditions.entries()) {
  await q('INSERT INTO conditions_kb (name, description, red_flags, kb_embedding) VALUES ($1, $2, $3, $4::vector)', [
    c.name, c.description, c.red_flags, vec(kbVectors[i]),
  ]);
}
log(`${medications.length} medications, ${interactions.length} interactions, ${conditions.length} KB conditions embedded`);

// ---------------------------------------------------------------------------
// Historical visits
// ---------------------------------------------------------------------------
const takenSlots = new Set<string>(); // `${doctorId}|${iso}`
const slotKey = (doctorId: number, d: Date) => `${doctorId}|${d.toISOString()}`;

function freeHistoricalSlot(doctorId: number, minDaysAgo: number, maxDaysAgo: number): Date {
  for (;;) {
    const [h, m] = pick(SLOTS);
    // Skewed towards recent days so dashboards have a busy last month.
    const daysAgo = minDaysAgo + Math.floor(Math.pow(rand(), 1.8) * (maxDaysAgo - minDaysAgo + 1));
    const d = istDate(-daysAgo, h, m);
    if (istWeekday(d) === 0 || takenSlots.has(slotKey(doctorId, d))) continue;
    takenSlots.add(slotKey(doctorId, d));
    return d;
  }
}

const doctorsByDept = new Map<string, DoctorRec[]>();
for (const d of doctorRecs) doctorsByDept.set(d.dept, [...(doctorsByDept.get(d.dept) ?? []), d]);
const demoPatient = patientRecs.find((p) => p.email === DEMO_PATIENT)!;
const demoDoctor = doctorRecs.find((d) => d.email === DEMO_DOCTOR)!;
const patientsWithDx = new Map<string, number[]>();

function choosePatient(t: CaseTemplate): PatientRec {
  const fits = (p: PatientRec) =>
    p.age >= t.age_range[0] - 2 && p.age <= t.age_range[1] + 2 && (!t.gender || p.gender === t.gender);
  // Chronic problems recur: 40% of the time reuse a patient already seen for this diagnosis.
  const previous = patientsWithDx.get(t.diagnosis) ?? [];
  if (previous.length && rand() < 0.4) {
    const repeatId = pick(previous);
    return patientRecs.find((p) => p.id === repeatId)!;
  }
  const pool = patientRecs.filter(fits);
  return pick(pool.length ? pool : patientRecs.filter((p) => !t.gender || p.gender === t.gender));
}

interface PlannedVisit { template: CaseTemplate; note: string; patient: PatientRec; doctor: DoctorRec }
const planned: PlannedVisit[] = [];
// The demo patient gets a few visits so their portal has history.
const demoTemplates = caseTemplates
  .filter((t) => demoPatient.age >= t.age_range[0] && demoPatient.age <= t.age_range[1] && (!t.gender || t.gender === demoPatient.gender))
  .slice(0, 3);
for (const t of caseTemplates) {
  t.notes.forEach((note, i) => {
    const patient = i === 0 && demoTemplates.includes(t) ? demoPatient : choosePatient(t);
    patientsWithDx.set(t.diagnosis, [...(patientsWithDx.get(t.diagnosis) ?? []), patient.id]);
    const deptDoctors = doctorsByDept.get(t.dept) ?? doctorRecs;
    // General Medicine notes lean towards the demo doctor so her history is rich.
    const doctor = t.dept === 'General Medicine' && rand() < 0.6 ? demoDoctor : pick(deptDoctors);
    planned.push({ template: t, note, patient, doctor });
  });
}

const noteVectors = await embedMany(planned.map((p) => p.note));
let visitCount = 0;
for (const [i, v] of planned.entries()) {
  const at = freeHistoricalSlot(v.doctor.id, 2, 540);
  const visitAt = new Date(at.getTime() + intBetween(5, 25) * 60_000);
  await tx(v.doctor.id, async () => {
    const appt = await q<{ appointment_id: number }>(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, reason, created_at)
       VALUES ($1, $2, $3, 'completed', $4, $3::TIMESTAMPTZ - ($5 || ' days')::INTERVAL) RETURNING appointment_id`,
      [v.patient.id, v.doctor.id, at, pick(v.template.reasons), String(intBetween(1, 12))],
    );
    const followUp = rand() < 0.6 ? new Date(visitAt.getTime() + intBetween(7, 30) * 86_400_000) : null;
    const visit = await q<{ visit_id: number }>(
      `INSERT INTO visits (appointment_id, symptom_note, note_embedding, diagnosis, follow_up_date, outcome, created_at)
       VALUES ($1, $2, $3::vector, $4, ($5::TIMESTAMPTZ AT TIME ZONE 'Asia/Kolkata')::DATE, $6, $7) RETURNING visit_id`,
      [appt.rows[0].appointment_id, v.note, vec(noteVectors[i]), v.template.diagnosis, followUp,
       pick(v.template.outcomes), visitAt],
    );
    const visitId = visit.rows[0].visit_id;

    const regimen = v.template.regimens.length ? pick(v.template.regimens) : [];
    if (regimen.length) {
      const items = regimen.map((r) => ({
        medication_id: medIds.get(r.name), dosage: r.dosage, frequency: r.frequency, duration_days: r.duration_days,
      }));
      const before = await q<{ max: number | null }>('SELECT max(audit_id) AS max FROM prescription_audit');
      const rx = await q<{ p_prescription_id: number }>('CALL sp_issue_prescription($1, $2, $3::JSONB, NULL)', [
        visitId, rand() < 0.3 ? 'Review if symptoms persist beyond the course.' : null, JSON.stringify(items),
      ]);
      // Backdate the prescription and its audit rows to the visit time.
      await q('UPDATE prescriptions SET issued_at = $2 WHERE prescription_id = $1', [rx.rows[0].p_prescription_id, visitAt]);
      await q('UPDATE prescription_audit SET changed_at = $2 WHERE audit_id > $1', [before.rows[0].max ?? 0, visitAt]);
    }
    for (const lab of v.template.labs) {
      const [lo, hi] = rand() < 0.75 ? lab.abnormal : lab.normal;
      const value = Math.round(between(lo, hi) * 100) / 100;
      await q(
        `INSERT INTO lab_results (visit_id, test_name, result_value, unit, ref_range, tested_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [visitId, lab.test_name, value, lab.unit, lab.ref_range, new Date(visitAt.getTime() + 3_600_000)],
      );
    }
  });
  visitCount++;
}
log(`${visitCount} historical visits with prescriptions and labs`);

// Cancelled and no-show history.
let missed = 0;
for (let i = 0; i < 28; i++) {
  const doctor = pick(doctorRecs);
  const at = freeHistoricalSlot(doctor.id, 2, 400);
  await q(
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, reason, created_at)
     VALUES ($1, $2, $3, $4, $5, $3::TIMESTAMPTZ - INTERVAL '5 days')`,
    [pick(patientRecs).id, doctor.id, at, i % 3 === 0 ? 'no_show' : 'cancelled', pick(pick(caseTemplates).reasons)],
  );
  missed++;
}
log(`${missed} cancelled / no-show appointments`);

// ---------------------------------------------------------------------------
// Today's queue for the demo doctor (inserted directly: some times have passed)
// ---------------------------------------------------------------------------
const todaySlots: [number, number][] = [[9, 30], [10, 0], [10, 30], [11, 30], [12, 0], [14, 30], [15, 0], [16, 0]];
const queuePatients = [demoPatient, ...patientRecs.filter((p) => p.id !== demoPatient.id && p.age >= 16).slice(3, 10)];
const generalTemplates = caseTemplates.filter((t) => t.dept === 'General Medicine' || t.dept === 'Gastroenterology');
for (const [i, [h, m]] of todaySlots.entries()) {
  const at = istDate(0, h, m);
  takenSlots.add(slotKey(demoDoctor.id, at));
  await q(
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, reason, created_at)
     VALUES ($1, $2, $3, 'scheduled', $4, now() - INTERVAL '3 days')`,
    [queuePatients[i % queuePatients.length].id, demoDoctor.id, at, pick(pick(generalTemplates).reasons)],
  );
}
log(`${todaySlots.length} appointments in today's queue for ${demoDoctor.email}`);

// ---------------------------------------------------------------------------
// Upcoming bookings, made through the booking procedure
// ---------------------------------------------------------------------------
let booked = 0;
const futurePatients = [demoPatient, ...patientRecs];
for (let i = 0; i < 70 && booked < 48; i++) {
  const doctor = i < 6 ? demoDoctor : pick(doctorRecs);
  const [h, m] = pick(SLOTS);
  const at = istDate(intBetween(1, 14), h, m);
  if (istWeekday(at) === 0) continue;
  const patient = i < 2 ? demoPatient : pick(futurePatients);
  const template = caseTemplates.find((t) => t.dept === doctor.dept) ?? pick(caseTemplates);
  try {
    await tx(null, () => q('CALL sp_book_appointment($1, $2, $3, $4, NULL)', [patient.id, doctor.id, at, pick(template.reasons)]));
    booked++;
  } catch {
    // Slot clash with an earlier booking: the procedure rejected it, which is the point.
  }
}
log(`${booked} upcoming appointments booked via sp_book_appointment`);

// ---------------------------------------------------------------------------
// A few prescription edits so the audit log shows UPDATE and DELETE too
// ---------------------------------------------------------------------------
const recentItems = await q<{ item_id: number; doctor_id: number; duration_days: number }>(
  `SELECT pi.item_id, a.doctor_id, pi.duration_days
     FROM prescription_items pi
     JOIN prescriptions pr ON pr.prescription_id = pi.prescription_id
     JOIN visits v ON v.visit_id = pr.visit_id
     JOIN appointments a ON a.appointment_id = v.appointment_id
    WHERE (SELECT count(*) FROM prescription_items x WHERE x.prescription_id = pi.prescription_id) > 1
    ORDER BY v.created_at DESC LIMIT 6`,
);
for (const [i, item] of recentItems.rows.entries()) {
  await tx(item.doctor_id, async () => {
    if (i < 4) {
      await q('UPDATE prescription_items SET duration_days = $2 WHERE item_id = $1', [
        item.item_id, Math.min(180, item.duration_days + (i % 2 === 0 ? 7 : -1 * Math.min(item.duration_days - 1, 2))),
      ]);
    } else {
      await q('DELETE FROM prescription_items WHERE item_id = $1', [item.item_id]);
    }
  });
}
await q(`UPDATE prescription_audit SET changed_at = now() - (audit_id % 5 || ' days')::INTERVAL - INTERVAL '2 hours'
          WHERE action <> 'INSERT'`);
log('audit trail includes UPDATE and DELETE events');

// ---------------------------------------------------------------------------
// Real stock levels, statistics
// ---------------------------------------------------------------------------
for (const m of medications) {
  await q('UPDATE medications SET stock_qty = $2 WHERE medication_id = $1', [medIds.get(m.name), m.stock_qty]);
}
await q('REFRESH MATERIALIZED VIEW mv_diagnosis_stats');
await q('ANALYZE');

const counts = await q(`
  SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM appointments) AS appointments,
         (SELECT count(*) FROM visits) AS visits, (SELECT count(*) FROM prescription_items) AS rx_items,
         (SELECT count(*) FROM lab_results) AS labs, (SELECT count(*) FROM prescription_audit) AS audit_rows`);
await client.end();
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s`, counts.rows[0]);
console.log(`Sign in with ${ADMINS[0].email} / ${DEMO_DOCTOR} / ${DEMO_PATIENT} (password = DEMO_PASSWORD)`);
