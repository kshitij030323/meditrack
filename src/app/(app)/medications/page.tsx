import type { Metadata } from 'next';
import { MedicationsView } from '@/components/admin/medications-view';
import { requirePageRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Formulary' };

export default async function MedicationsPage() {
  const user = await requirePageRole('admin', 'doctor');
  return <MedicationsView role={user.role === 'admin' ? 'admin' : 'doctor'} />;
}
