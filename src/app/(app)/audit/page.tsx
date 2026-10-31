import type { Metadata } from 'next';
import { AuditView } from '@/components/admin/audit-view';
import { requirePageRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Prescription audit' };

export default async function AuditPage() {
  await requirePageRole('admin');
  return <AuditView />;
}
