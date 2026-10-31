import type { Metadata } from 'next';
import { requirePageRole } from '@/lib/session';
import { TriageView } from './triage-view';

export const metadata: Metadata = { title: 'Triage' };

export default async function TriagePage({ searchParams }: { searchParams: Promise<{ note?: string }> }) {
  await requirePageRole('doctor');
  const { note } = await searchParams;
  return <TriageView initialNote={note ?? ''} />;
}
