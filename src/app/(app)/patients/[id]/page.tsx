import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requirePageRole } from '@/lib/session';
import { PatientChart } from './patient-chart';

export const metadata: Metadata = { title: 'Patient record' };

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole('doctor', 'patient');
  const { id } = await params;
  if (user.role === 'patient') {
    // Patients only ever see their own record.
    if (id !== 'me') redirect('/patients/me');
    return <PatientChart patientKey="me" userId={user.id} role="patient" />;
  }
  if (id === 'me') redirect('/patients');
  const patientId = Number(id);
  if (!Number.isInteger(patientId) || patientId <= 0) notFound();
  return <PatientChart patientKey={String(patientId)} userId={user.id} role="doctor" />;
}
