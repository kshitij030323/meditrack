import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/session';
import { DashboardView } from './dashboard-view';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getSessionUser();
  return <DashboardView role={user.role} name={user.name} />;
}
