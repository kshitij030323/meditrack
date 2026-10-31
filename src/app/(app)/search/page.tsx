import type { Metadata } from 'next';
import { requirePageRole } from '@/lib/session';
import { SearchView } from './search-view';

export const metadata: Metadata = { title: 'Medical search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; mode?: string; open?: string }>;
}) {
  await requirePageRole('doctor', 'admin');
  const sp = await searchParams;
  return (
    <SearchView
      initialQuery={sp.q ?? ''}
      initialKind={sp.kind === 'medications' ? 'medications' : 'conditions'}
      initialMode={sp.mode === 'semantic' || sp.mode === 'keyword' ? sp.mode : 'hybrid'}
      initialOpen={sp.open ? Number(sp.open) : null}
    />
  );
}
