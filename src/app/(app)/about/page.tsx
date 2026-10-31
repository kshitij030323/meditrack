import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/session';
import { AboutView } from './about-view';

export const metadata: Metadata = { title: 'About MediTrack' };

export default async function AboutPage() {
  await getSessionUser();
  return <AboutView />;
}
