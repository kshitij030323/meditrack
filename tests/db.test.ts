/**
 * Database-level tests for MediTrack's integrity rules, procedures, triggers,
 * views and vector search. Every test runs inside a transaction that is rolled
 * back, so the seeded data is never changed (the concurrency test cleans up
 * after itself). Run with: npm test   (requires a seeded database)
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 6 });

interface Ids {
  doctor: number;
  otherDoctor: number;
  patient: number;
  otherPatient: number;
  dept: number;
  warfarin: number;
  aspirin: number;
  pantoprazole: number;
  futureMonday: string;
  futureSunday: string;
}
let ids: Ids;

/** Runs fn in a transaction that is always rolled back. */
async function inTx<T>(fn: (c: pg.PoolClient) => Promise<T>, actor?: number): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    if (actor) await c.query("SELECT set_config('app.user_id', $1, true)", [String(actor)]);
    return await fn(c);
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
}

/** Asserts the statement fails with the given SQLSTATE (and constraint, if given). */
async function rejects(c: pg.PoolClient, sql: string, params: unknown[], code: string, constraint?: string) {
  await c.query('SAVEPOINT t');
  try {
    await c.query(sql, params);
    assert.fail(`expected SQLSTATE ${code}`);
  } catch (err) {
    const e = err as { code?: string; constraint?: string };
    if (e.code === undefined) throw err;
    assert.equal(e.code, code);
    if (constraint) assert.equal(e.constraint, constraint);
  } finally {
    await c.query('ROLLBACK TO SAVEPOINT t');
  }
}

const one = async <T = Record<string, unknown>>(c: pg.PoolClient | pg.Pool, sql: string, params: unknown[] = []) =>
  (await c.query(sql, params)).rows[0] as T;

/** A visit owned by `doctor`, created inside the caller's transaction. */
async function makeVisit(c: pg.PoolClient, doctor: number, patient: number) {
  const appt = await one<{ appointment_id: number }>(
    c,
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status)
     VALUES ($1, $2, date_trunc('hour', now()) - INTERVAL '1 day', 'scheduled') RETURNING appointment_id`,
    [patient, doctor],
  );
  const v = await one<{ p_visit_id: number }>(c, 'CALL sp_record_visit($1, $2, $3, NULL, $4, NULL, NULL, NULL)', [
    appt.appointment_id, doctor, 'Test note with enough characters', 'Test diagnosis',
  ]);
  const rx = await one<{ prescription_id: number }>(
    c, 'INSERT INTO prescriptions (visit_id) VALUES ($1) RETURNING prescription_id', [v.p_visit_id],
  );
  return { appointmentId: appt.appointment_id, visitId: v.p_visit_id, prescriptionId: rx.prescription_id };
}

before(async () => {
  const r = await one<Ids>(
    pool,
    `SELECT (SELECT user_id FROM users WHERE email = 'ananya.rao@meditrack.in')   AS doctor,
            (SELECT doctor_id FROM doctors ORDER BY doctor_id DESC LIMIT 1)        AS "otherDoctor",
            (SELECT user_id FROM users WHERE email = 'rahul.sharma@example.com')  AS patient,
            (SELECT patient_id FROM patients ORDER BY patient_id DESC LIMIT 1)     AS "otherPatient",
            (SELECT dept_id FROM departments WHERE name = 'General Medicine')     AS dept,
            (SELECT medication_id FROM medications WHERE name = 'Warfarin')       AS warfarin,
            (SELECT medication_id FROM medications WHERE name = 'Aspirin')        AS aspirin,
            (SELECT medication_id FROM medications WHERE name = 'Pantoprazole')   AS pantoprazole,
            ((date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '28 days' + TIME '10:00')
               AT TIME ZONE 'Asia/Kolkata')::TEXT                                 AS "futureMonday",
            ((date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '34 days' + TIME '10:00')
               AT TIME ZONE 'Asia/Kolkata')::TEXT                                 AS "futureSunday"`,
  );
  for (const [k, v] of Object.entries(r)) assert.ok(v, `seed data missing: ${k} (run npm run db:seed)`);
  ids = r;
});

after(() => pool.end());

describe('CHECK, UNIQUE and FOREIGN KEY constraints', () => {
  it('rejects a phone number that is not 10 digits (chk_pat_phone)', () =>
    inTx((c) => rejects(c, 'UPDATE patients SET phone = $2 WHERE patient_id = $1', [ids.patient, '98450'], '23514', 'chk_pat_phone')));

  it('rejects an email with capitals (chk_users_email)', () =>
    inTx((c) =>
      rejects(c, `INSERT INTO users (email, password_hash, full_name, role) VALUES ('Bad@Example.com', repeat('x', 60), 'Bad Case', 'admin')`, [], '23514', 'chk_users_email'),
    ));

  it('rejects a date of birth in the future (chk_pat_dob)', () =>
    inTx((c) => rejects(c, 'UPDATE patients SET dob = CURRENT_DATE + 1 WHERE patient_id = $1', [ids.patient], '23514', 'chk_pat_dob')));

  it('rejects appointments off the 15-minute grid (chk_appt_minute)', () =>
    inTx((c) =>
      rejects(c, `INSERT INTO appointments (patient_id, doctor_id, scheduled_at) VALUES ($1, $2, $3::TIMESTAMPTZ + INTERVAL '7 minutes')`,
        [ids.patient, ids.doctor, ids.futureMonday], '23514', 'chk_appt_minute'),
    ));

  it('rejects a duplicate email (UNIQUE)', () =>
    inTx((c) =>
      rejects(c, `INSERT INTO users (email, password_hash, full_name, role) VALUES ('ananya.rao@meditrack.in', repeat('x', 60), 'Copy', 'admin')`, [], '23505'),
    ));

  it('keeps departments with doctors (ON DELETE RESTRICT)', () =>
    inTx((c) => rejects(c, 'DELETE FROM departments WHERE dept_id = $1', [ids.dept], '23503', 'doctors_dept_id_fkey')));

  it('stores drug pairs in canonical order (chk_di_distinct)', () =>
    inTx((c) =>
      rejects(c, `INSERT INTO drug_interactions (medication_a_id, medication_b_id, severity, description) VALUES ($1, $2, 'minor', 'x')`,
        [Math.max(ids.warfarin, ids.aspirin), Math.min(ids.warfarin, ids.aspirin)], '23514', 'chk_di_distinct'),
    ));
});

describe('sp_book_appointment (stored procedure, transaction)', () => {
  const book = (c: pg.PoolClient, at: string, patient = ids.patient, doctor = ids.doctor) =>
    c.query('CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ, $4, NULL)', [patient, doctor, at, 'test']);

  it('books a free weekday slot', () =>
    inTx(async (c) => {
      const { rows } = await book(c, ids.futureMonday);
      assert.ok(rows[0].p_appointment_id > 0);
    }));

  it('refuses Sundays', () =>
    inTx((c) => rejects(c, 'CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ, NULL, NULL)', [ids.patient, ids.doctor, ids.futureSunday], 'MT422')));

  it('refuses times outside consultation hours', () =>
    inTx((c) =>
      rejects(c, `CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ + INTERVAL '10 hours', NULL, NULL)`, [ids.patient, ids.doctor, ids.futureMonday], 'MT422'),
    ));

  it('refuses a second booking within 30 minutes for the same doctor', () =>
    inTx(async (c) => {
      await book(c, ids.futureMonday);
      await rejects(c, `CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ + INTERVAL '15 minutes', NULL, NULL)`,
        [ids.otherPatient, ids.doctor, ids.futureMonday], 'MT409');
    }));

  it('lets a cancelled slot be booked again (partial unique index)', () =>
    inTx(async (c) => {
      const { rows } = await book(c, ids.futureMonday);
      await c.query(`UPDATE appointments SET status = 'cancelled' WHERE appointment_id = $1`, [rows[0].p_appointment_id]);
      const again = await book(c, ids.futureMonday, ids.otherPatient);
      assert.ok(again.rows[0].p_appointment_id > 0);
    }));

  it('lets exactly one of several concurrent bookings commit (row lock)', async () => {
    const at = ids.futureMonday.replace(/10:00:00/, '11:00:00');
    const patients = (await pool.query<{ patient_id: number }>('SELECT patient_id FROM patients ORDER BY patient_id LIMIT 4')).rows;
    const results = await Promise.allSettled(
      patients.map(async ({ patient_id }) => {
        const c = await pool.connect();
        try {
          await c.query('BEGIN');
          const { rows } = await c.query('CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ, NULL, NULL)', [patient_id, ids.doctor, at]);
          await c.query('SELECT pg_sleep(0.1)');
          await c.query('COMMIT');
          return rows[0].p_appointment_id as number;
        } catch (err) {
          await c.query('ROLLBACK');
          throw err;
        } finally {
          c.release();
        }
      }),
    );
    const ok = results.filter((r): r is PromiseFulfilledResult<number> => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    await pool.query('DELETE FROM appointments WHERE appointment_id = ANY($1::INT[])', [ok.map((r) => r.value)]);
    assert.equal(ok.length, 1);
    assert.ok(failed.every((f) => (f.reason as { code?: string }).code === 'MT409'));
  });
});

describe('visit recording and appointment state machine', () => {
  it('sp_record_visit completes the appointment', () =>
    inTx(async (c) => {
      const { appointmentId } = await makeVisit(c, ids.doctor, ids.patient);
      const a = await one<{ status: string }>(c, 'SELECT status FROM appointments WHERE appointment_id = $1', [appointmentId]);
      assert.equal(a.status, 'completed');
    }));

  it('sp_record_visit refuses another doctor’s appointment (MT403)', () =>
    inTx(async (c) => {
      const appt = await one<{ appointment_id: number }>(
        c, `INSERT INTO appointments (patient_id, doctor_id, scheduled_at) VALUES ($1, $2, date_trunc('hour', now())) RETURNING appointment_id`,
        [ids.patient, ids.doctor],
      );
      await rejects(c, 'CALL sp_record_visit($1, $2, $3, NULL, NULL, NULL, NULL, NULL)', [appt.appointment_id, ids.otherDoctor, 'Note long enough'], 'MT403');
    }));

  it('a completed appointment cannot be cancelled (trg_appt_status_guard)', () =>
    inTx(async (c) => {
      const { appointmentId } = await makeVisit(c, ids.doctor, ids.patient);
      await rejects(c, `UPDATE appointments SET status = 'cancelled' WHERE appointment_id = $1`, [appointmentId], 'MT422');
    }));

  it('a future appointment cannot be marked no-show', () =>
    inTx(async (c) => {
      const { rows } = await c.query('CALL sp_book_appointment($1, $2, $3::TIMESTAMPTZ, NULL, NULL)', [ids.patient, ids.doctor, ids.futureMonday]);
      await rejects(c, `UPDATE appointments SET status = 'no_show' WHERE appointment_id = $1`, [rows[0].p_appointment_id], 'MT422');
    }));

  it('rejects a symptom note shorter than 10 characters (chk_visit_note)', () =>
    inTx(async (c) => {
      const appt = await one<{ appointment_id: number }>(
        c, `INSERT INTO appointments (patient_id, doctor_id, scheduled_at) VALUES ($1, $2, date_trunc('hour', now())) RETURNING appointment_id`,
        [ids.patient, ids.doctor],
      );
      await rejects(c, 'CALL sp_record_visit($1, $2, $3, NULL, NULL, NULL, NULL, NULL)', [appt.appointment_id, ids.doctor, 'short'], '23514', 'chk_visit_note');
    }));
});

describe('prescription triggers', () => {
  it('blocks a severe interaction inside one prescription', () =>
    inTx(async (c) => {
      const { prescriptionId } = await makeVisit(c, ids.doctor, ids.patient);
      await c.query(`INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days) VALUES ($1, $2, '5 mg', 'OD', 10)`, [prescriptionId, ids.warfarin]);
      await rejects(c, `INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days) VALUES ($1, $2, '75 mg', 'OD', 10)`,
        [prescriptionId, ids.aspirin], 'MT422');
    }, ids.doctor));

  it('reserves stock on insert and returns it on delete', () =>
    inTx(async (c) => {
      const { prescriptionId } = await makeVisit(c, ids.doctor, ids.patient);
      const stock = async () => (await one<{ s: number }>(c, 'SELECT stock_qty AS s FROM medications WHERE medication_id = $1', [ids.pantoprazole])).s;
      const before = await stock();
      const item = await one<{ item_id: number }>(c,
        `INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days) VALUES ($1, $2, '40 mg', 'BD', 7) RETURNING item_id`,
        [prescriptionId, ids.pantoprazole]);
      assert.equal(await stock(), before - 14); // BD x 7 days = 14 tablets (fn_units_required)
      await c.query('DELETE FROM prescription_items WHERE item_id = $1', [item.item_id]);
      assert.equal(await stock(), before);
    }, ids.doctor));

  it('refuses a line when stock is insufficient', () =>
    inTx(async (c) => {
      const { prescriptionId } = await makeVisit(c, ids.doctor, ids.patient);
      await c.query('UPDATE medications SET stock_qty = 3 WHERE medication_id = $1', [ids.pantoprazole]);
      await rejects(c, `INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days) VALUES ($1, $2, '40 mg', 'OD', 10)`,
        [prescriptionId, ids.pantoprazole], 'MT422');
    }, ids.doctor));

  it('writes INSERT, UPDATE and DELETE audit rows attributed to app.user_id', () =>
    inTx(async (c) => {
      const { prescriptionId } = await makeVisit(c, ids.doctor, ids.patient);
      const item = await one<{ item_id: number }>(c,
        `INSERT INTO prescription_items (prescription_id, medication_id, dosage, frequency, duration_days) VALUES ($1, $2, '40 mg', 'OD', 5) RETURNING item_id`,
        [prescriptionId, ids.pantoprazole]);
      await c.query('UPDATE prescription_items SET duration_days = 10 WHERE item_id = $1', [item.item_id]);
      await c.query('DELETE FROM prescription_items WHERE item_id = $1', [item.item_id]);
      const rows = (await c.query<{ action: string; changed_by: number; old_days: number | null; new_days: number | null }>(
        `SELECT action, changed_by, (old_data->>'duration_days')::INT AS old_days, (new_data->>'duration_days')::INT AS new_days
           FROM prescription_audit WHERE COALESCE(new_data, old_data)->>'item_id' = $1::TEXT ORDER BY audit_id`,
        [item.item_id])).rows;
      assert.deepEqual(rows.map((r) => r.action), ['INSERT', 'UPDATE', 'DELETE']);
      assert.ok(rows.every((r) => r.changed_by === ids.doctor));
      assert.deepEqual([rows[1].old_days, rows[1].new_days], [5, 10]);
    }, ids.doctor));
});

describe('lab grading trigger (trg_lab_status)', () => {
  const grade = (value: number, range: string) =>
    inTx(async (c) => {
      const { visitId } = await makeVisit(c, ids.doctor, ids.patient);
      const r = await one<{ status: string }>(c,
        `INSERT INTO lab_results (visit_id, test_name, result_value, ref_range, status) VALUES ($1, 'Test', $2, $3, 'normal') RETURNING status`,
        [visitId, value, range]);
      return r.status;
    });
  it('grades a value inside the range as normal', async () => assert.equal(await grade(90, '70-100'), 'normal'));
  it('grades a value just outside the range as abnormal', async () => assert.equal(await grade(130, '70-100'), 'abnormal'));
  it('grades a value beyond twice the upper limit as critical', async () => assert.equal(await grade(0.9, '<0.04'), 'critical'));
  it('grades a low value against a lower bound', async () => assert.equal(await grade(20, '>40'), 'critical'));
  it('rejects an unparseable reference range (chk_lab_range)', () =>
    inTx(async (c) => {
      const { visitId } = await makeVisit(c, ids.doctor, ids.patient);
      await rejects(c, `INSERT INTO lab_results (visit_id, test_name, result_value, ref_range) VALUES ($1, 'Test', 1, 'about 5')`, [visitId], '23514', 'chk_lab_range');
    }));
});

describe('vector and hybrid search', () => {
  it('fn_similar_cases ranks a visit’s own embedding first with similarity ≈ 1', async () => {
    const v = await one<{ visit_id: number }>(pool, 'SELECT visit_id FROM visits WHERE note_embedding IS NOT NULL LIMIT 1');
    const top = await one<{ visit_id: number; similarity: number }>(pool,
      `SELECT s.visit_id, s.similarity::FLOAT AS similarity
         FROM visits v, fn_similar_cases(v.note_embedding, 3) s WHERE v.visit_id = $1 LIMIT 1`, [v.visit_id]);
    assert.equal(top.visit_id, v.visit_id);
    assert.ok(top.similarity > 0.999);
  });

  it('fn_search_conditions finds GERD for a reflux query in every mode', async () => {
    for (const mode of ['semantic', 'keyword', 'hybrid']) {
      const top = await one<{ name: string }>(pool,
        `SELECT c.name FROM conditions_kb q,
                fn_search_conditions(q.kb_embedding, 'burning chest pain after meals acid reflux', $1, 3) s
           JOIN conditions_kb c ON c.condition_id = s.condition_id
          WHERE q.name ILIKE '%reflux%' LIMIT 1`, [mode]);
      assert.match(top.name, /reflux|GERD/i, `mode ${mode}`);
    }
  });

  it('every visit, condition and medication has a 384-dimension embedding', async () => {
    const r = await one<{ missing: number; dims: number }>(pool,
      `SELECT (SELECT count(*) FROM visits WHERE note_embedding IS NULL)
            + (SELECT count(*) FROM conditions_kb WHERE kb_embedding IS NULL)
            + (SELECT count(*) FROM medications WHERE med_embedding IS NULL) AS missing,
              (SELECT vector_dims(note_embedding) FROM visits LIMIT 1) AS dims`);
    assert.equal(Number(r.missing), 0);
    assert.equal(r.dims, 384);
  });
});

describe('views and security', () => {
  it('v_case_library exposes no names, emails or phone numbers', async () => {
    const cols = (await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'v_case_library'`)).rows.map((r) => r.column_name);
    for (const banned of ['patient_name', 'full_name', 'email', 'phone']) assert.ok(!cols.includes(banned), banned);
  });

  it('mv_diagnosis_stats refreshes concurrently and matches the visits table', async () => {
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_diagnosis_stats');
    const r = await one<{ mv: number; raw: number }>(pool,
      `SELECT (SELECT sum(case_count) FROM mv_diagnosis_stats) AS mv, (SELECT count(*) FROM visits WHERE diagnosis IS NOT NULL) AS raw`);
    assert.equal(Number(r.mv), Number(r.raw));
  });

  it('stores passwords only as bcrypt hashes', async () => {
    const r = await one<{ bad: number }>(pool, `SELECT count(*) AS bad FROM users WHERE password_hash NOT LIKE '$2%' OR length(password_hash) <> 60`);
    assert.equal(Number(r.bad), 0);
  });

  it('the read-only role cannot see password hashes or write', async () => {
    const reader = new pg.Client({ connectionString: process.env.DATABASE_READER_URL });
    await reader.connect();
    try {
      await assert.rejects(reader.query('SELECT password_hash FROM users LIMIT 1'), { code: '42501' });
      await assert.rejects(reader.query('DELETE FROM lab_results'), (e: { code?: string }) => ['25006', '42501'].includes(e.code ?? ''));
      const r = await reader.query('SELECT count(*) FROM v_case_library');
      assert.ok(Number(r.rows[0].count) > 0);
    } finally {
      await reader.end();
    }
  });
});
