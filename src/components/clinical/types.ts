// Response shapes of the clinical API routes (mirrors the views they read from).

export type Role = 'admin' | 'doctor' | 'patient';
export type ApptStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type Outcome = 'resolved' | 'improving' | 'unchanged' | 'referred' | 'admitted';

/** A row of v_clinician_schedule. */
export interface ScheduleRow {
  appointment_id: number;
  scheduled_at: string;
  local_date: string;
  status: ApptStatus;
  reason: string | null;
  created_at?: string;
  doctor_id: number;
  doctor_name: string;
  specialization?: string;
  department: string;
  dept_id?: number;
  patient_id: number;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  blood_group?: string | null;
  patient_phone?: string;
  visit_id: number | null;
  diagnosis: string | null;
}

export interface DoctorRow {
  doctor_id: number;
  full_name: string;
  specialization: string;
  consult_fee: number;
  years_exp: number;
  dept_id: number;
  department: string;
}

export interface PatientRow {
  patient_id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  age: number;
  gender: string;
  blood_group: string | null;
  phone: string;
  visit_count: number;
  last_visit_at: string | null;
  next_appointment_at: string | null;
  no_show_count: number;
}

export interface RxItem {
  item_id: number;
  medication_id: number;
  name: string;
  strength: string | null;
  form: string;
  dosage: string;
  frequency: string;
  duration_days: number;
}

export interface LabRow {
  lab_result_id: number;
  test_name: string;
  result_value: number;
  unit: string | null;
  ref_range: string | null;
  status: 'normal' | 'abnormal' | 'critical';
  tested_at: string;
}

export interface VisitRecord {
  visit_id: number;
  created_at: string;
  symptom_note: string;
  diagnosis: string | null;
  follow_up_date: string | null;
  outcome: Outcome | null;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  department: string;
  prescriptions: { prescription_id: number; issued_at: string; notes: string | null; items: RxItem[] }[];
  labs: LabRow[];
}

export interface PatientProfile extends PatientRow {
  dob: string;
  address: string | null;
  emergency_contact: string | null;
}

export interface PatientRecord {
  profile: PatientProfile;
  appointments: {
    appointment_id: number;
    scheduled_at: string;
    status: ApptStatus;
    reason: string | null;
    doctor_id: number;
    doctor_name: string;
    department: string;
    visit_id: number | null;
  }[];
  visits: VisitRecord[];
}

/** A row of v_medication_stock. */
export interface MedicationRow {
  medication_id: number;
  name: string;
  form: string;
  strength: string | null;
  drug_class: string | null;
  description: string | null;
  stock_qty: number;
  reorder_level: number;
  low_stock: boolean;
}

export interface InteractionHit {
  interaction_id: number;
  medication_a_id: number;
  medication_a: string;
  medication_b_id: number;
  medication_b: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface SimilarCase {
  visit_id: number;
  visit_date: string;
  symptom_note: string;
  diagnosis: string | null;
  outcome: Outcome | null;
  patient_age: number;
  patient_gender: string;
  department: string;
  treatment: string | null;
  labs: string | null;
  abnormal_labs: number;
  similarity: number;
}

export interface ConditionMatch {
  condition_id: number;
  name: string;
  description: string;
  red_flags: string | null;
  similarity: number | null;
  score: number;
}

export interface SimilarResponse {
  cases: SimilarCase[];
  conditions: ConditionMatch[];
  distribution: { diagnosis: string; count: number; best: number }[];
  timings: { embed_ms: number; sql_ms: number };
}
