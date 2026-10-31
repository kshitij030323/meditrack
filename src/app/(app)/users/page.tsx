import type { Metadata } from 'next';
import { UsersView } from '@/components/admin/users-view';
import { requirePageRole } from '@/lib/session';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const user = await requirePageRole('admin');
  return <UsersView currentUserId={user.id} />;
}
