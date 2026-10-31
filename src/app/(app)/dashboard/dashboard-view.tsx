'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowUpRight, CalendarPlus, Clock, PackageX, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarList, Legend, StackedColumns, type ChartSeries } from '@/components/charts';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  cx,
  Empty,
  PageHeader,
  Panel,
  Segmented,
  Skeleton,
  Stat,
  StatusBadge,
  table,
  Textarea,
} from '@/components/ui';
import type { Role } from '@/lib/auth';
import { api, fmt } from '@/lib/client';

export function DashboardView({ role, name }: { role: Role; name: string }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<DashboardData>('/api/dashboard') });
  if (error) return <Empty title="The dashboard could not load">{(error as Error).message}</Empty>;
  if (isLoading || !data) return <DashboardSkeleton />;
  if (data.role === 'admin') return <AdminDashboard data={data} />;
  if (data.role === 'doctor') return <DoctorDashboard data={data} name={name} />;
  return <PatientDashboard data={data} name={name} />;
}

function greeting() {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
interface AdminData {
  role: 'admin';
  kpis: Record<'patients' | 'doctors' | 'appointments_today' | 'visits_30d' | 'low_stock' | 'audit_7d', number>;
  trend: { day: string; completed: number; scheduled: number; cancelled: number; no_show: number }[];
  departments: { dept_id: number; name: string; doctor_count: number; upcoming_appointments: number; visits_90d: number }[];
  diagnoses: { diagnosis: string; cases: number; escalations: number }[];
  lowStock: { medication_id: number; name: string; strength: string | null; form: string; stock_qty: number; reorder_level: number }[];
  audit: { audit_id: number; action: string; changed_at: string; changed_by_name: string | null; medication_name: string | null; patient_name: string | null }[];
}

const TREND_SERIES: ChartSeries[] = [
  { key: 'completed', label: 'Completed', color: 'var(--chart-done)' },
  { key: 'no_show', label: 'No-show', color: 'var(--chart-warn)' },
  { key: 'scheduled', label: 'Scheduled', color: 'var(--chart-sched)' },
];

function AdminDashboard({ data }: { data: AdminData }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const today = fmt.isoDay(0);
  const todayIndex = data.trend.findIndex((d) => d.day === today);
  const k = data.kpis;
  return (
    <>
      <PageHeader
        title="Hospital overview"
        description={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}. Live figures from the MediTrack database.`}
        actions={
          <ButtonLink href="/appointments?book=1" variant="primary" icon={<CalendarPlus className="size-4" />}>
            Book appointment
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active patients" value={k.patients} tone="core" />
        <Stat label="Active doctors" value={k.doctors} tone="core" />
        <Stat label="Appointments today" value={k.appointments_today} tone="core" />
        <Stat label="Visits in 30 days" value={k.visits_30d} tone="ok" />
        <Stat label="Low-stock medicines" value={k.low_stock} tone={k.low_stock ? 'warn' : 'ref'} sub="At or below reorder level" />
        <Stat label="Prescription changes" value={k.audit_7d} tone="audit" sub="Audit rows, last 7 days" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Appointment activity"
          description="Last 30 days and the next 14, by outcome. Cancelled bookings are left out."
          actions={
            <Segmented
              label="Display"
              value={view}
              onChange={setView}
              options={[
                { value: 'chart', label: 'Chart' },
                { value: 'table', label: 'Table' },
              ]}
            />
          }
        >
          {view === 'chart' ? (
            <>
              <Legend series={TREND_SERIES} className="mb-3" />
              <StackedColumns
                data={data.trend}
                series={TREND_SERIES}
                xLabel={(d) => fmt.dateShort(d.day)}
                markerIndex={todayIndex}
                markerLabel="Today"
                ariaLabel="Daily appointments by outcome"
              />
            </>
          ) : (
            <div className={cx(table.wrap, 'max-h-72 overflow-y-auto')}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th className={table.th}>Day</th>
                    {TREND_SERIES.map((s) => (
                      <th key={s.key} className={cx(table.th, 'text-right')}>
                        {s.label}
                      </th>
                    ))}
                    <th className={cx(table.th, 'text-right')}>Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trend.map((d) => (
                    <tr key={d.day} className={cx(table.row, d.day === today && 'bg-core-soft/50')}>
                      <td className={table.td}>
                        {fmt.weekday(d.day)} {fmt.dateShort(d.day)}
                      </td>
                      <td className={cx(table.td, 'num text-right')}>{d.completed}</td>
                      <td className={cx(table.td, 'num text-right')}>{d.no_show}</td>
                      <td className={cx(table.td, 'num text-right')}>{d.scheduled}</td>
                      <td className={cx(table.td, 'num text-right text-ink-3')}>{d.cancelled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Department load" description="Completed visits in the last 90 days (view v_department_load)">
          <BarList
            items={data.departments.map((d) => ({
              label: d.name,
              value: d.visits_90d,
              hint: `${d.doctor_count} doctors, ${d.upcoming_appointments} upcoming appointments`,
            }))}
          />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Most frequent diagnoses" description="mv_diagnosis_stats, diagnoses with at least 2 cases">
          <BarList items={data.diagnoses.map((d) => ({ label: d.diagnosis, value: d.cases, hint: `${d.escalations} referred or admitted` }))} />
        </Panel>

        <Panel
          title="Running low"
          description="Formulary items at or below their reorder level"
          actions={
            <Link href="/medications" className="text-[13px] font-semibold text-core hover:underline">
              Open formulary
            </Link>
          }
          bodyClassName="p-0"
        >
          {data.lowStock.length ? (
            <ul className="divide-y divide-line">
              {data.lowStock.map((m) => (
                <li key={m.medication_id}>
                  <Link href={`/medications?open=${m.medication_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted">
                    <PackageX className="size-4 shrink-0 text-warn" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{m.name}</span>
                      <span className="text-xs text-ink-3">
                        {m.strength} {m.form}
                      </span>
                    </span>
                    <span className="num text-right text-sm">
                      <span className="font-bold text-warn">{m.stock_qty}</span>
                      <span className="text-ink-3"> / {m.reorder_level}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Stock levels are healthy" />
          )}
        </Panel>

        <Panel
          title="Latest prescription changes"
          description="Written by trigger trg_rx_items_audit"
          actions={
            <Link href="/audit" className="text-[13px] font-semibold text-core hover:underline">
              Full audit log
            </Link>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-line">
            {data.audit.map((a) => (
              <li key={a.audit_id} className="flex items-start gap-3 px-5 py-3">
                <StatusBadge status={a.action} className="mt-0.5" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{a.medication_name ?? 'Medication'}</span>
                  <span className="text-ink-2"> for {a.patient_name ?? 'a removed record'}</span>
                  <span className="block text-xs text-ink-3">
                    {a.changed_by_name ?? 'System'}, {fmt.relative(a.changed_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------------
interface DoctorData {
  role: 'doctor';
  kpis: { today_total: number; today_done: number; next_7_days: number; patients_seen: number };
  today: {
    appointment_id: number;
    scheduled_at: string;
    status: string;
    reason: string | null;
    patient_id: number;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    blood_group: string | null;
    visit_id: number | null;
    diagnosis: string | null;
  }[];
  followUps: { visit_id: number; follow_up_date: string; diagnosis: string | null; patient_id: number; patient_name: string }[];
  diagnoses: { diagnosis: string; cases: number }[];
  recent: { visit_id: number; scheduled_at: string; patient_id: number; patient_name: string; diagnosis: string | null }[];
}

function DoctorDashboard({ data, name }: { data: DoctorData; name: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const nextUp = data.today.find((a) => a.status === 'scheduled');
  const remaining = data.today.filter((a) => a.status === 'scheduled').length;
  return (
    <>
      <PageHeader
        title={`${greeting()}, Dr. ${name.split(' ')[0]}`}
        description={
          data.kpis.today_total
            ? `${data.kpis.today_total} patients on today’s list. ${data.kpis.today_done} seen, ${remaining} waiting.`
            : 'No appointments on your list today.'
        }
        actions={
          <ButtonLink href="/appointments" icon={<Clock className="size-4" />}>Full schedule</ButtonLink>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title="Today’s list" description="Clinic time, Asia/Kolkata" bodyClassName="p-0">
          {data.today.length ? (
            <ol className="divide-y divide-line">
              {data.today.map((a) => {
                const isNext = a.appointment_id === nextUp?.appointment_id;
                return (
                  <li key={a.appointment_id} className={cx('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5', isNext && 'bg-core-soft/45')}>
                    <span className="num w-[4.75rem] shrink-0 font-mono text-sm font-semibold whitespace-nowrap text-ink-2">{fmt.time(a.scheduled_at)}</span>
                    <span className="hidden sm:block">
                      <Avatar name={a.patient_name} size="sm" tone={a.status === 'completed' ? 'ok' : 'core'} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link href={`/patients/${a.patient_id}`} className="font-semibold hover:underline">
                          {a.patient_name}
                        </Link>
                        <span className="text-[13px] text-ink-3">
                          {a.patient_age} y, {a.patient_gender}
                          {a.blood_group ? `, ${a.blood_group}` : ''}
                        </span>
                        {isNext && <Badge tone="core">Up next</Badge>}
                      </span>
                      <span className="block truncate text-[13px] text-ink-2">
                        {a.status === 'completed' ? `Diagnosed: ${a.diagnosis ?? 'not recorded'}` : (a.reason ?? 'No reason given')}
                      </span>
                    </span>
                    {a.status === 'scheduled' ? (
                      <ButtonLink
                        href={`/consult/${a.appointment_id}`}
                        size="sm"
                        variant={isNext ? 'primary' : 'secondary'}
                        icon={<Stethoscope className="size-4" />}
                      >
                        Start consultation
                      </ButtonLink>
                    ) : (
                      <StatusBadge status={a.status} />
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty title="Your list is clear" icon={<Clock className="size-6" />}>
              New bookings for today appear here as patients make them.
            </Empty>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Quick triage" description="Describe a presentation to see the closest past cases.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim().length >= 10) router.push(`/triage?note=${encodeURIComponent(note.trim())}`);
              }}
            >
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. 54 y M, burning chest pain after heavy meals, worse lying down, 3 weeks"
              />
              <Button type="submit" variant="vector" className="mt-2 w-full" icon={<Activity className="size-4" />} disabled={note.trim().length < 10}>
                Find similar cases
              </Button>
            </form>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Booked, next 7 days" value={data.kpis.next_7_days} tone="core" />
            <Stat label="Patients you’ve seen" value={data.kpis.patients_seen} tone="ok" />
          </div>

          <Panel title="Follow-ups due" description="No future appointment booked yet" bodyClassName="p-0">
            {data.followUps.length ? (
              <ul className="divide-y divide-line">
                {data.followUps.map((f) => (
                  <li key={f.visit_id}>
                    <Link href={`/patients/${f.patient_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{f.patient_name}</span>
                        <span className="block truncate text-xs text-ink-3">{f.diagnosis ?? 'Follow-up'}</span>
                      </span>
                      <span className="text-right text-xs">
                        <span className={cx('block font-semibold', f.follow_up_date < fmt.isoDay(0) ? 'text-warn' : 'text-ink-2')}>
                          {fmt.date(f.follow_up_date)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nothing due this week" />
            )}
          </Panel>

          <Panel title="Your most common diagnoses">
            <BarList items={data.diagnoses.map((d) => ({ label: d.diagnosis, value: d.cases }))} />
          </Panel>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------
interface PatientData {
  role: 'patient';
  profile: { age: number; gender: string; blood_group: string | null; phone: string; visit_count: number; last_visit_at: string | null } | null;
  upcoming: { appointment_id: number; scheduled_at: string; reason: string | null; doctor_name: string; specialization: string; department: string }[];
  prescriptions: {
    prescription_id: number;
    issued_at: string;
    doctor_name: string;
    diagnosis: string | null;
    items: { name: string; strength: string | null; dosage: string; frequency: string; duration_days: number }[];
  }[];
  labs: { lab_result_id: number; test_name: string; result_value: number; unit: string | null; ref_range: string | null; status: string; tested_at: string }[];
}

function PatientDashboard({ data, name }: { data: PatientData; name: string }) {
  const next = data.upcoming[0];
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name.split(' ')[0]}`}
        description={
          next
            ? `Your next appointment is with Dr. ${next.doctor_name} on ${fmt.date(next.scheduled_at)} at ${fmt.time(next.scheduled_at)}.`
            : 'You have no upcoming appointments.'
        }
        actions={
          <ButtonLink href="/appointments?book=1" variant="primary" icon={<CalendarPlus className="size-4" />}>
            Book appointment
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel
            title="Upcoming appointments"
            actions={
              <Link href="/appointments" className="text-[13px] font-semibold text-core hover:underline">
                Manage
              </Link>
            }
            bodyClassName="p-0"
          >
            {data.upcoming.length ? (
              <ul className="divide-y divide-line">
                {data.upcoming.map((a) => (
                  <li key={a.appointment_id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-14 shrink-0 rounded-lg border border-line py-1 text-center">
                      <div className="text-[11px] font-semibold text-core">{fmt.weekday(a.scheduled_at)}</div>
                      <div className="num text-lg leading-tight font-bold">
                        {new Date(a.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Dr. {a.doctor_name}</p>
                      <p className="text-[13px] text-ink-3">
                        {a.department}, {fmt.time(a.scheduled_at)}
                      </p>
                      {a.reason && <p className="truncate text-[13px] text-ink-2">{a.reason}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No appointments booked" action={<ButtonLink href="/appointments?book=1">Book one now</ButtonLink>} />
            )}
          </Panel>

          <Panel
            title="Recent prescriptions"
            actions={
              <Link href="/patients/me" className="text-[13px] font-semibold text-core hover:underline">
                Full record
              </Link>
            }
          >
            {data.prescriptions.length ? (
              <div className="space-y-5">
                {data.prescriptions.map((p) => (
                  <div key={p.prescription_id}>
                    <p className="text-[13px] text-ink-3">
                      {fmt.date(p.issued_at)}, Dr. {p.doctor_name}
                      {p.diagnosis ? ` for ${p.diagnosis}` : ''}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {p.items.map((it) => (
                        <li key={it.name} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="font-semibold">{it.name}</span>
                          <span className="text-ink-3">{it.strength}</span>
                          <span className="font-mono text-[13px] text-ink-2">
                            {it.dosage}, {it.frequency}, {it.duration_days} days
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-3">No prescriptions yet.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {data.profile && (
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Age" value={data.profile.age} />
              <Stat label="Blood group" value={data.profile.blood_group ?? '—'} tone="danger" />
              <Stat label="Visits" value={data.profile.visit_count} tone="core" />
            </div>
          )}
          <Panel title="Latest lab results" bodyClassName="p-0">
            {data.labs.length ? (
              <ul className="divide-y divide-line">
                {data.labs.map((l) => (
                  <li key={l.lab_result_id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{l.test_name}</span>
                      <span className="text-xs text-ink-3">
                        {fmt.date(l.tested_at)}
                        {l.ref_range ? `, reference ${l.ref_range}` : ''}
                      </span>
                    </span>
                    <span className="num font-mono text-sm font-semibold">
                      {l.result_value} <span className="font-sans font-normal text-ink-3">{l.unit}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No lab results yet" />
            )}
          </Panel>
          <Link
            href="/patients/me"
            className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4 font-semibold hover:bg-muted"
          >
            View your full health record
            <ArrowUpRight className="size-4 text-ink-3" />
          </Link>
        </div>
      </div>
    </>
  );
}

type DashboardData = AdminData | DoctorData | PatientData;
