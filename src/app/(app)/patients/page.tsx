import type { Metadata } from 'next';
import { requirePageRole } from '@/lib/session';
import { PatientsView } from './patients-view';

export const metadata: Metadata = { title: 'Patients' };

export default async function PatientsPage() {
  await requirePageRole('doctor');
  return <PatientsView />;
}
