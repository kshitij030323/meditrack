'use client';

import { ArrowUpRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { BrandMark } from '@/components/app-shell';
import { Avatar, Button, Field, Input, StatusBadge } from '@/components/ui';

interface DemoAccount {
  role: 'admin' | 'doctor' | 'patient';
  email: string;
  name: string;
  note: string;
}

export function LoginView({ demo }: { demo: { password: string; accounts: DemoAccount[] } | null }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function login(e: string, p: string, key: string) {
    setPending(key);
    setError(null);
    const res = await signIn('credentials', { email: e, password: p, redirect: false });
    if (res?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setPending(null);
      setError('That email and password don’t match an active account.');
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="relative hidden overflow-hidden bg-[#101b25] px-12 py-12 text-[#dfe7ee] lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-xl font-bold text-white">MediTrack</span>
        </div>

        <Constellation />

        <div className="relative mt-auto max-w-[34rem]">
          <h1 className="text-[40px] leading-[1.08] font-bold tracking-tight text-white">
            Hospital records that remember similar cases.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-[#aebdca]">
            Appointments, visits, prescriptions and lab results live in PostgreSQL. A symptom note is turned into a
            384-dimension vector and compared with every past visit, so the closest cases, and how they turned out,
            are one search away.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <dt className="text-[#7f93a4]">Semantic triage</dt>
              <dd className="mt-1 text-white">pgvector + HNSW</dd>
            </div>
            <div>
              <dt className="text-[#7f93a4]">Grounded answers</dt>
              <dd className="mt-1 text-white">RAG with citations</dd>
            </div>
            <div>
              <dt className="text-[#7f93a4]">Rules in the database</dt>
              <dd className="mt-1 text-white">Triggers, procedures</dd>
            </div>
          </dl>
          <p className="mt-10 text-[13px] text-[#7f93a4]">
            DBMS Level 3 project by Kshitij Gupta (PES1UG24AM915) and Avinash MJ (PES1UG24AM347)
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark />
            <span className="text-xl font-bold">MediTrack</span>
          </div>
          <h2 className="text-[26px] font-bold">Sign in</h2>
          <p className="mt-1 text-ink-2">Use the account your hospital administrator created for you.</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login(email, password, 'form');
            }}
          >
            <Field label="Email">
              {(id) => (
                <Input id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>
            <Field label="Password">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" loading={pending === 'form'} icon={<Lock className="size-4" />}>
              Sign in
            </Button>
          </form>

          {demo && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-ink-2">Demo accounts</h3>
              <p className="mt-0.5 text-[13px] text-ink-3">Seeded data. Each role sees a different part of the app.</p>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {demo.accounts.map((a) => (
                  <li key={a.email}>
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => login(a.email, demo.password, a.email)}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <Avatar name={a.name} tone={a.role === 'admin' ? 'audit' : a.role === 'doctor' ? 'core' : 'ref'} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{a.name}</span>
                          <StatusBadge status={a.role} />
                        </span>
                        <span className="block truncate text-[13px] text-ink-3">{a.note}</span>
                      </span>
                      <ArrowUpRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Decorative preview of the triage view: past cases arranged by distance from a new note. */
function Constellation() {
  const points = Array.from({ length: 46 }, (_, i) => {
    const angle = (i * 137.508 * Math.PI) / 180;
    const r = 40 + ((i * 53) % 170);
    // Rounded so server and browser render identical attribute strings.
    const round = (v: number) => Math.round(v * 10) / 10;
    return { x: round(230 + Math.cos(angle) * r), y: round(210 + Math.sin(angle) * r * 0.82), r: i % 7 === 0 ? 4.5 : 2.6, near: r < 95 };
  });
  return (
    <svg viewBox="0 0 460 420" className="pointer-events-none absolute top-16 -right-16 w-[560px] opacity-90" aria-hidden>
      {[70, 130, 190].map((r) => (
        <ellipse key={r} cx="230" cy="210" rx={r} ry={r * 0.82} fill="none" stroke="#2a3a49" strokeDasharray="2 5" />
      ))}
      {points.map((p, i) => (
        <g key={i}>
          {p.near && <line x1="230" y1="210" x2={p.x} y2={p.y} stroke="#a891ff" strokeOpacity="0.25" />}
          <circle cx={p.x} cy={p.y} r={p.r} fill={p.near ? '#a891ff' : '#4d6275'} />
        </g>
      ))}
      <circle cx="230" cy="210" r="9" fill="#101b25" stroke="#78a2ff" strokeWidth="3" />
    </svg>
  );
}
