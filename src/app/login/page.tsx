import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { LoginView } from './login-view';

export const metadata: Metadata = { title: 'Sign in' };

const DEMO_ACCOUNTS = [
  { role: 'doctor' as const, email: 'ananya.rao@meditrack.in', name: 'Dr. Ananya Rao', note: 'General Medicine: today’s queue, triage, assistant' },
  { role: 'admin' as const, email: 'kshitij.gupta@meditrack.in', name: 'Kshitij Gupta', note: 'Administration: users, formulary, audit, DB Lab' },
  { role: 'patient' as const, email: 'rahul.sharma@example.com', name: 'Rahul Sharma', note: 'Patient portal: bookings and health record' },
];

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');
  const demo = process.env.DEMO_MODE === 'true' && process.env.DEMO_PASSWORD
    ? { password: process.env.DEMO_PASSWORD, accounts: DEMO_ACCOUNTS }
    : null;
  return <LoginView demo={demo} />;
}
