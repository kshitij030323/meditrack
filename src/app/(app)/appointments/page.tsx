import type { Metadata } from 'next';
import { requirePageRole } from '@/lib/session';
import { AppointmentsView } from './appointments-view';

export const metadata: Metadata = { title: 'Appointments' };

export default async function AppointmentsPage() {
  const user = await requirePageRole('admin', 'doctor', 'patient');
  return <AppointmentsView userId={user.id} role={user.role} />;
}
