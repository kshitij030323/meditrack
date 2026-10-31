import type { Metadata } from 'next';
import { DepartmentsView } from '@/components/admin/departments-view';
import { requirePageRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Departments' };

export default async function DepartmentsPage() {
  await requirePageRole('admin');
  return <DepartmentsView />;
}
