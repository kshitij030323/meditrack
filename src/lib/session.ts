import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, type Role } from './auth';

/** For server components: the signed-in user, redirecting to /login when absent. */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  return session.user;
}

/** Page-level RBAC: users without one of `roles` are sent back to their dashboard. */
export async function requirePageRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!roles.includes(user.role)) redirect('/dashboard?denied=1');
  return user;
}
