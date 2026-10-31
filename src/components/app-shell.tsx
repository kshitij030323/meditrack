'use client';

import { Command as Cmdk } from 'cmdk';
import { LogOut, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Role } from '@/lib/auth';
import { api } from '@/lib/client';
import { NAV, type Domain } from '@/lib/nav';
import { Avatar, cx, Kbd, StatusBadge } from './ui';

export interface ShellUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const domainMarker: Record<Domain, string> = {
  core: 'bg-core',
  vector: 'bg-vector',
  ref: 'bg-ref',
  audit: 'bg-audit',
  neutral: 'bg-ink-3',
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (searchParams.get('denied')) toast.error('Your role does not have access to that page.');
  }, [searchParams]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = useMemo(
    () =>
      NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(user.role)) })).filter((g) => g.items.length),
    [user.role],
  );
  const activeHref = useMemo(() => {
    const all = groups.flatMap((g) => g.items);
    return all
      .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [groups, pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <BrandMark />
        <span className="text-[19px] font-bold tracking-tight text-ink">MediTrack</span>
      </Link>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-ink-3 hover:border-line-strong"
      >
        <Search className="size-4" />
        <span className="flex-1">Jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {groups.map((g) => (
          <div key={g.group} className="mt-3 first:mt-0">
            <p className="px-2 pb-1 text-[12px] font-semibold text-ink-3">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[14px] transition-colors',
                        active ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-ink-2 hover:bg-surface/70 hover:text-ink',
                      )}
                    >
                      {active && (
                        <span className={cx('absolute inset-y-1.5 left-0 w-[3px] rounded-r', domainMarker[item.domain])} />
                      )}
                      <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                      {user.role === 'patient' && item.patientLabel ? item.patientLabel : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-2.5 px-2">
          <Avatar name={user.name} tone={user.role === 'admin' ? 'audit' : user.role === 'doctor' ? 'core' : 'ref'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {user.role === 'doctor' ? `Dr. ${user.name}` : user.name}
            </p>
            <StatusBadge status={user.role} className="mt-0.5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface hover:text-ink"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-line bg-muted lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 hover:bg-muted">
          <Menu className="size-5" />
        </button>
        <BrandMark />
        <span className="font-bold">MediTrack</span>
        <button type="button" aria-label="Search" onClick={() => setPaletteOpen(true)} className="ml-auto rounded-md p-1.5 hover:bg-muted">
          <Search className="size-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#0a1118]/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-muted shadow-pop">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1.5 hover:bg-surface"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} user={user} />
    </div>
  );
}

/** A cross formed from two offset bars: a medical mark without the red-cross emblem. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cx('size-7', className)} aria-hidden>
      <rect x="10" y="3" width="8" height="22" rx="2.5" fill="var(--core)" />
      <rect x="3" y="10" width="22" height="8" rx="2.5" fill="var(--vector)" opacity="0.9" />
      <rect x="10" y="10" width="8" height="8" fill="var(--surface)" opacity="0.35" />
    </svg>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  useEffect(() => {
    try {
      const t = localStorage.getItem('mt-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
    } catch {}
  }, []);
  const cycle = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    try {
      if (next === 'system') {
        localStorage.removeItem('mt-theme');
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem('mt-theme', next);
        document.documentElement.dataset.theme = next;
      }
    } catch {}
  };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface hover:text-ink"
      title="Switch colour theme"
    >
      <Icon className="size-4" />
      {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
    </button>
  );
}

interface QuickResults {
  patients: { id: number; title: string; age: number; gender: string }[];
  medications: { id: number; title: string; strength: string | null; form: string }[];
  conditions: { id: number; title: string }[];
}

function CommandPalette({ open, onClose, user }: { open: boolean; onClose: () => void; user: ShellUser }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<QuickResults | null>(null);

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api<QuickResults>(`/api/search/quick?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then(setResults)
        .catch(() => undefined);
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open) return null;
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const pages = NAV.flatMap((g) => g.items).filter((i) => i.roles.includes(user.role));
  const itemCls =
    'flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-2 data-[selected=true]:bg-muted data-[selected=true]:text-ink';
  const groupCls = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-ink-3';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-[#0a1118]/45" onClick={onClose} aria-hidden />
      <Cmdk
        label="Command menu"
        shouldFilter={false}
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-[pop-in_160ms_ease-out]"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-4 text-ink-3" />
          <Cmdk.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder={user.role === 'doctor' ? 'Search patients, medications, conditions or pages' : 'Search pages and medications'}
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
          />
          <Kbd>Esc</Kbd>
        </div>
        <Cmdk.List className="max-h-[50vh] overflow-y-auto p-2">
          <Cmdk.Empty className="px-3 py-6 text-center text-sm text-ink-3">No matches.</Cmdk.Empty>
          {results?.patients.length ? (
            <Cmdk.Group heading="Patients" className={groupCls}>
              {results.patients.map((p) => (
                <Cmdk.Item key={`p${p.id}`} value={`p${p.id}`} onSelect={() => go(`/patients/${p.id}`)} className={itemCls}>
                  <Avatar name={p.title} size="sm" />
                  <span className="flex-1 text-ink">{p.title}</span>
                  <span className="text-xs text-ink-3">
                    {p.age} y, {p.gender}
                  </span>
                </Cmdk.Item>
              ))}
            </Cmdk.Group>
          ) : null}
          {results?.medications.length ? (
            <Cmdk.Group heading="Medications" className={groupCls}>
              {results.medications.map((m) => (
                <Cmdk.Item key={`m${m.id}`} value={`m${m.id}`} onSelect={() => go(`/medications?open=${m.id}`)} className={itemCls}>
                  <span className="size-2 rounded-full bg-ref" />
                  <span className="flex-1 text-ink">{m.title}</span>
                  <span className="text-xs text-ink-3">
                    {m.strength} {m.form}
                  </span>
                </Cmdk.Item>
              ))}
            </Cmdk.Group>
          ) : null}
          {results?.conditions.length ? (
            <Cmdk.Group heading="Conditions" className={groupCls}>
              {results.conditions.map((c) => (
                <Cmdk.Item key={`c${c.id}`} value={`c${c.id}`} onSelect={() => go(`/search?q=${encodeURIComponent(c.title)}&open=${c.id}`)} className={itemCls}>
                  <span className="size-2 rounded-full bg-vector" />
                  <span className="flex-1 text-ink">{c.title}</span>
                </Cmdk.Item>
              ))}
            </Cmdk.Group>
          ) : null}
          <Cmdk.Group heading="Pages" className={groupCls}>
            {pages
              .filter((p) => !q || p.label.toLowerCase().includes(q.toLowerCase()))
              .map((p) => {
                const Icon = p.icon;
                return (
                  <Cmdk.Item key={p.href} value={p.href} onSelect={() => go(p.href)} className={itemCls}>
                    <Icon className="size-4" />
                    <span className="text-ink">{user.role === 'patient' && p.patientLabel ? p.patientLabel : p.label}</span>
                  </Cmdk.Item>
                );
              })}
          </Cmdk.Group>
        </Cmdk.List>
      </Cmdk>
    </div>
  );
}
