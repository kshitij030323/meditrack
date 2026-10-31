import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { getSessionUser } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <Suspense>
      <AppShell user={{ id: user.id, name: user.name, email: user.email, role: user.role }}>{children}</AppShell>
    </Suspense>
  );
}
