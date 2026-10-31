// Shapes for the synthetic seed data. Every constraint noted here mirrors a
// CHECK constraint or business rule in db/*.sql, so seed rows insert cleanly.

export type Gender = 'male' | 'female' | 'other';
export type MedForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'ointment' | 'drops';
export type Severity = 'minor' | 'moderate' | 'severe';
export type Frequency = 'OD' | 'BD' | 'TDS' | 'QID' | 'HS' | 'SOS' | 'STAT';
export type Outcome = 'resolved' | 'improving' | 'unchanged' | 'referred' | 'admitted';

export interface DepartmentSeed {
  name: string; // <= 80 chars, unique
  description: string;
  location: string; // <= 60 chars, e.g. "Block A, Floor 2"
}

export interface DoctorSeed {
  full_name: string; // without the "Dr." prefix
  email: string; // lowercase, unique
  dept: string; // must equal a DepartmentSeed.name
  license_no: string; // unique, <= 40 chars
  specialization: string; // <= 80 chars
  consult_fee: number; // 0..100000 (INR)
  years_exp: number; // 0..60
}

export interface PatientSeed {
  full_name: string;
  email: string; // lowercase, unique
  dob: string; // YYYY-MM-DD, after 1900-01-01 and in the past
  gender: Gender;
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
  phone: string; // exactly 10 digits
  address: string;
  emergency_contact: string | null; // exactly 10 digits or null
}

export interface MedicationSeed {
  name: string; // unique, <= 120 chars, e.g. "Pantoprazole"
  form: MedForm;
  strength: string; // <= 30 chars, e.g. "40 mg"
  unit_price: number; // INR per unit
  stock_qty: number; // final stock after seeding (a few should be low, < 40)
  drug_class: string; // <= 60 chars, e.g. "Proton pump inhibitor"
  description: string; // plain-language indications + key cautions, 25-60 words
}

export interface InteractionSeed {
  a: string; // MedicationSeed.name
  b: string; // MedicationSeed.name (different from a)
  severity: Severity;
  description: string; // mechanism + clinical consequence + what to do, 15-40 words
}

export interface ConditionSeed {
  name: string; // unique, <= 120 chars
  description: string; // symptom-rich lay + clinical language, 50-110 words
  red_flags: string; // warning signs needing urgent escalation, 15-40 words
}

export interface CaseMed {
  name: string; // MedicationSeed.name
  dosage: string; // <= 40 chars, e.g. "40 mg" or "1 tablet" or "10 ml"
  frequency: Frequency;
  duration_days: number; // 1..180
}

export interface CaseLab {
  test_name: string; // <= 80 chars
  unit: string; // <= 20 chars
  ref_range: string; // ONLY "lo-hi", "<hi" or ">lo" with plain numbers, e.g. "70-100", "<0.04", ">40"
  normal: [number, number]; // value range when this lab is normal for the case
  abnormal: [number, number]; // value range consistent with this diagnosis
}

export interface CaseTemplate {
  diagnosis: string; // <= 200 chars; should equal a ConditionSeed.name
  dept: string; // DepartmentSeed.name
  notes: string[]; // 3-4 distinct symptom notes (each >= 10 chars, typically 25-70 words)
  age_range: [number, number];
  gender?: 'male' | 'female'; // only when the condition is sex-specific
  regimens: CaseMed[][]; // 1-3 alternative regimens; never two meds with a SEVERE interaction in one regimen
  labs: CaseLab[]; // 0-3 relevant tests
  outcomes: Outcome[]; // weighted pool, e.g. ['resolved','resolved','improving']
  reasons: string[]; // 2-3 appointment reasons as a patient would book them, <= 200 chars
}
