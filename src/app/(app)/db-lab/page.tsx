import type { Metadata } from 'next';
import { DbLabView } from '@/components/admin/db-lab-view';
import { requirePageRole } from '@/lib/session';

export const metadata: Metadata = { title: 'DB Lab' };

export default async function DbLabPage() {
  await requirePageRole('admin');
  return <DbLabView />;
}
