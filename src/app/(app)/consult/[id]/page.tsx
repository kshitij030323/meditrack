import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/session';
import { ConsultView } from './consult-view';

export const metadata: Metadata = { title: 'Consultation' };

export default async function ConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole('doctor');
  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) notFound();
  return <ConsultView appointmentId={appointmentId} userId={user.id} />;
}
