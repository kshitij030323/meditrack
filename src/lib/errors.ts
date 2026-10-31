import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string,
  ) {
    super(message);
  }
}

/** Plain-language messages for constraints the UI can trip. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  users_email_key: 'That email is already registered.',
  chk_users_email: 'Email must be lowercase and look like name@domain.tld.',
  chk_users_name: 'Full name must be at least 2 characters.',
  departments_name_key: 'A department with that name already exists.',
  chk_dept_name: 'Department name must be at least 2 characters.',
  doctors_license_no_key: 'That license number is already registered.',
  chk_doc_fee: 'Consultation fee must be between 0 and 100000.',
  chk_doc_exp: 'Years of experience must be between 0 and 60.',
  chk_pat_dob: 'Date of birth must be after 1900 and in the past.',
  chk_pat_blood: 'Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-.',
  chk_pat_phone: 'Phone number must be exactly 10 digits.',
  chk_pat_ec: 'Emergency contact must be exactly 10 digits.',
  chk_appt_minute: 'Appointments start on a 15-minute boundary.',
  uq_appt_doctor_slot: 'This slot is already booked for the doctor.',
  chk_visit_note: 'The symptom note must be at least 10 characters.',
  chk_visit_followup: 'Follow-up date cannot be before the visit date.',
  chk_visit_outcome: 'Outcome must be resolved, improving, unchanged, referred or admitted.',
  medications_name_key: 'A medication with that name already exists.',
  chk_med_stock: 'Stock cannot go below zero.',
  chk_med_price: 'Price cannot be negative.',
  chk_med_form: 'Form must be tablet, capsule, syrup, injection, ointment or drops.',
  chk_med_reorder: 'Reorder level cannot be negative.',
  uq_presc_med: 'That medication is already on this prescription.',
  chk_item_days: 'Duration must be between 1 and 180 days.',
  chk_item_freq: 'Frequency must be OD, BD, TDS, QID, HS, SOS or STAT.',
  chk_item_dosage: 'Dosage is required.',
  chk_lab_range: 'Reference range must look like 70-100, <200 or >40.',
  chk_di_distinct: 'An interaction needs two different medications.',
  uq_di_pair: 'That interaction is already recorded.',
};

const FK_MESSAGES: Record<string, string> = {
  doctors_dept_id_fkey: 'This department still has doctors assigned (ON DELETE RESTRICT).',
  appointments_doctor_id_fkey: 'This doctor still has appointments (ON DELETE RESTRICT).',
  prescription_items_medication_id_fkey: 'This medication appears on prescriptions (ON DELETE RESTRICT).',
};

interface PgError {
  code?: string;
  constraint?: string;
  message: string;
  detail?: string;
  hint?: string;
}

function isPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as PgError).code === 'string';
}

export interface ErrorBody {
  error: string;
  detail?: string;
  hint?: string;
  /** SQLSTATE and constraint name so the UI can show which database rule fired. */
  db?: { code: string; constraint?: string; kind: string };
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message, detail: err.detail } satisfies ErrorBody, { status: err.status });
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join('.');
    return Response.json(
      { error: field ? `${field}: ${issue.message}` : (issue?.message ?? 'Invalid input.') } satisfies ErrorBody,
      { status: 400 },
    );
  }
  if (isPgError(err)) {
    const { code = '', constraint, message, detail, hint } = err;
    const db = { code, constraint, kind: '' };
    const custom: Record<string, number> = { MT403: 403, MT404: 404, MT409: 409, MT422: 422 };
    if (code in custom) {
      db.kind = 'procedure / trigger';
      return Response.json({ error: message, detail, hint, db } satisfies ErrorBody, { status: custom[code] });
    }
    switch (code) {
      case '23505':
        db.kind = 'UNIQUE';
        return Response.json(
          { error: CONSTRAINT_MESSAGES[constraint ?? ''] ?? 'That record already exists.', db } satisfies ErrorBody,
          { status: 409 },
        );
      case '23514':
        db.kind = 'CHECK';
        return Response.json(
          { error: CONSTRAINT_MESSAGES[constraint ?? ''] ?? 'A database rule rejected this value.', db } satisfies ErrorBody,
          { status: 422 },
        );
      case '23503':
        db.kind = 'FOREIGN KEY';
        return Response.json(
          { error: FK_MESSAGES[constraint ?? ''] ?? 'A related record is missing or still in use.', db } satisfies ErrorBody,
          { status: 409 },
        );
      case '23502':
        db.kind = 'NOT NULL';
        return Response.json({ error: 'A required field is missing.', detail: message, db } satisfies ErrorBody, {
          status: 422,
        });
      case '22P02':
      case '22007':
      case '22008':
        db.kind = 'TYPE';
        return Response.json({ error: 'A value has the wrong format.', detail: message, db } satisfies ErrorBody, {
          status: 400,
        });
    }
  }
  console.error('[api] unhandled error', err);
  return Response.json({ error: 'Something went wrong on the server. Check the server log.' } satisfies ErrorBody, {
    status: 500,
  });
}
