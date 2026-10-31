import type { Metadata } from 'next';
import { requirePageRole } from '@/lib/session';
import { AssistantView } from './assistant-view';

export const metadata: Metadata = { title: 'Ask MediTrack' };

export default async function AssistantPage() {
  await requirePageRole('doctor');
  return <AssistantView />;
}
