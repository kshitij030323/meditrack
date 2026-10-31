'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  Check,
  FlaskConical,
  History,
  Pencil,
  Pill,
  Plus,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Answer, ProviderNote, SourceList, useRagStream } from '@/components/answer';
import { BookingDialog } from '@/components/clinical/booking-dialog';
import { groupLabs, LabTrendChart, StatusLegend } from '@/components/clinical/lab-trends';
import { PrescriptionBuilder, type DraftItem } from '@/components/clinical/prescription-builder';
import type { PatientRecord, Role, RxItem, VisitRecord } from '@/components/clinical/types';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  cx,
  Dialog,
  Empty,
  IconButton,
  Input,
  Panel,
  Select,
  Skeleton,
  StatusBadge,
  table,
  Tabs,
  Textarea,
} from '@/components/ui';
import { api, fmt, FREQUENCIES, toastError } from '@/lib/client';

type Tab = 'timeline' | 'labs' | 'appointments';

const freqLabel = (code: string) => FREQUENCIES.find((f) => f.code === code)?.label ?? code;

export function PatientChart({ patientKey, userId, role }: { patientKey: string; userId: number; role: Role }) {
  const [tab, setTab] = useState<Tab>('timeline');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);

  const record = useQuery({
    queryKey: ['patient', patientKey],
    queryFn: () => api<PatientRecord>(`/api/patients/${patientKey}`),
  });

  if (record.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (record.isError || !record.data) {
    return (
      <Empty
        title="This record couldn’t be opened"
        action={role === 'doctor' ? <ButtonLink href="/patients">Back to patients</ButtonLink> : undefined}
      >
        {(record.error as Error | null)?.message ?? 'Try again in a moment.'}
      </Empty>
    );
  }

  const { profile, visits, appointments } = record.data;
  const labSeries = groupLabs(visits);
  const labCount = visits.reduce((n, v) => n + v.labs.length, 0);

  const jumpToVisit = (visitId: number) => {
    setTab('timeline');
    setFlash(visitId);
    setTimeout(() => document.getElementById(`visit-${visitId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    setTimeout(() => setFlash(null), 2400);
  };

  return (
    <>
      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={profile.full_name} tone="ref" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-ink-3">{role === 'patient' ? 'My health record' : 'Patient record'}</p>
            <h1 className="text-[26px] leading-tight font-bold">{profile.full_name}</h1>
            <p className="mt-0.5 text-ink-2 capitalize">
              {profile.age} years, {profile.gender}, born {fmt.date(`${profile.dob}T12:00:00+05:30`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'doctor' ? (
              <>
                <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBookingOpen(true)}>
                  Book follow-up
                </Button>
                <Button
                  variant="vector"
                  icon={<Sparkles className="size-4" />}
                  onClick={() => setSummaryOpen(true)}
                  disabled={summaryOpen}
                >
                  Summarise record
                </Button>
              </>
            ) : (
              <ButtonLink href="/appointments?book=1" variant="primary" icon={<CalendarPlus className="size-4" />}>
                Book appointment
              </ButtonLink>
            )}
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Blood group" value={profile.blood_group ?? 'Not recorded'} />
          <Fact label="Phone" value={<span className="font-mono text-[13px]">{profile.phone}</span>} />
          <Fact label="Emergency contact" value={<span className="font-mono text-[13px]">{profile.emergency_contact ?? '—'}</span>} />
          <Fact label="Visits" value={<span className="num">{profile.visit_count}</span>} />
          <Fact label="Last visit" value={profile.last_visit_at ? fmt.date(profile.last_visit_at) : 'None yet'} />
          <Fact label="Next appointment" value={profile.next_appointment_at ? fmt.dateTime(profile.next_appointment_at) : 'None booked'} />
          {profile.address && <Fact label="Address" value={profile.address} className="col-span-2 sm:col-span-3 lg:col-span-6" />}
        </dl>
      </section>

      {role === 'doctor' && summaryOpen && (
        <SummaryPanel patientId={profile.patient_id} onClose={() => setSummaryOpen(false)} onJump={jumpToVisit} />
      )}

      <Tabs<Tab>
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'timeline', label: 'Visits', count: visits.length },
          { value: 'labs', label: 'Lab results', count: labCount },
          { value: 'appointments', label: 'Appointments', count: appointments.length },
        ]}
      />

      {tab === 'timeline' &&
        (visits.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface">
            <Empty icon={<History className="size-8" />} title="No visits recorded yet">
              Visits appear here once a doctor completes a consultation.
            </Empty>
          </div>
        ) : (
          <ol className="space-y-4">
            {visits.map((v) => (
              <VisitCard key={v.visit_id} visit={v} canEdit={role === 'doctor' && v.doctor_id === userId} flash={flash === v.visit_id} />
            ))}
          </ol>
        ))}

      {tab === 'labs' && <LabsTab series={labSeries} />}

      {tab === 'appointments' && <AppointmentsTab appointments={appointments} />}

      {role === 'doctor' && (
        <BookingDialog
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          role="doctor"
          defaultPatientId={profile.patient_id}
          defaultPatientName={profile.full_name}
          defaultDoctorId={userId}
        />
      )}
    </>
  );
}

function Fact({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SummaryPanel({ patientId, onClose, onJump }: { patientId: number; onClose: () => void; onJump: (visitId: number) => void }) {
  const stream = useRagStream(`/api/patients/${patientId}/summary`);
  const { start, stop } = stream;
  // Generate as soon as the panel opens; abort if it closes mid-stream.
  useEffect(() => {
    void start({});
    return () => stop();
  }, [start, stop]);
  return (
    <Panel
      className="mb-6 border-vector/30"
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-vector" /> Record summary
        </span>
      }
      description="Generated only from this chart. Citations like V2 jump to the visit."
      actions={
        <>
          {stream.streaming ? (
            <Button size="sm" icon={<Square className="size-3.5" />} onClick={stream.stop}>
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => stream.start({})}>
              Regenerate
            </Button>
          )}
          <IconButton label="Close summary" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {stream.error ? (
            <p className="text-sm text-danger">{stream.error}</p>
          ) : !stream.text && stream.streaming ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <Answer
              text={stream.text}
              sources={stream.sources}
              streaming={stream.streaming}
              onCite={(key) => {
                const src = stream.sources.find((s) => s.key === key);
                if (src) onJump(src.id);
              }}
            />
          )}
          <div className="mt-3">
            <ProviderNote llm={stream.llm} />
          </div>
        </div>
        <details className="text-sm lg:open:block" open>
          <summary className="mb-2 cursor-pointer text-[13px] font-semibold text-ink-2">Visits used ({stream.sources.length})</summary>
          <div className="max-h-80 overflow-y-auto pr-1">
            <SourceList sources={stream.sources} empty="Loading the record…" />
          </div>
        </details>
      </div>
    </Panel>
  );
}

function VisitCard({ visit: v, canEdit, flash }: { visit: VisitRecord; canEdit: boolean; flash: boolean }) {
  const [adding, setAdding] = useState(false);
  return (
    <li
      id={`visit-${v.visit_id}`}
      className={cx(
        'scroll-mt-6 rounded-xl border bg-surface transition-colors duration-700',
        flash ? 'border-vector bg-vector-soft/40' : 'border-line',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-3">
            {fmt.date(v.created_at)}, Dr. {v.doctor_name}, {v.department}
          </p>
          <h3 className="text-[17px] font-bold text-ink">{v.diagnosis ?? 'No diagnosis recorded'}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={v.outcome} />
          {v.follow_up_date && <Badge tone="core">Follow-up {fmt.date(`${v.follow_up_date}T12:00:00+05:30`)}</Badge>}
        </div>
      </header>
      <div className="space-y-4 px-5 py-4">
        <p className="rounded-lg bg-muted px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-2">{v.symptom_note}</p>

        {v.prescriptions.map((p) => (
          <div key={p.prescription_id}>
            <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <Pill className="size-4 text-ref" /> Prescription, issued {fmt.date(p.issued_at)}
            </p>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {p.items.map((it) => (
                <RxItemRow key={it.item_id} item={it} canEdit={canEdit} />
              ))}
              {p.items.length === 0 && <li className="px-3 py-2 text-sm text-ink-3">All lines were removed.</li>}
            </ul>
            {p.notes && <p className="mt-1.5 text-[13px] text-ink-3">Note: {p.notes}</p>}
          </div>
        ))}
        {canEdit && v.prescriptions.length === 0 && !adding && (
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add prescription
          </Button>
        )}
        {adding && <AddPrescription visitId={v.visit_id} onDone={() => setAdding(false)} />}

        {v.labs.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <FlaskConical className="size-4 text-core" /> Lab results
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {v.labs.map((l) => (
                <li key={l.lab_result_id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{l.test_name}</span>
                    <span className="text-xs text-ink-3">Reference {l.ref_range ?? 'not given'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num font-semibold">
                      {Number(l.result_value.toFixed(3))} <span className="text-xs font-normal text-ink-3">{l.unit}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {canEdit && v.prescriptions.length > 0 && (
          <p className="text-xs text-ink-3">
            You treated this visit, so you can amend its prescription. Every change is copied to the prescription audit log by the
            trg_rx_items_audit trigger.
          </p>
        )}
      </div>
    </li>
  );
}

function RxItemRow({ item, canEdit }: { item: RxItem; canEdit: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dosage, setDosage] = useState(item.dosage);
  const [frequency, setFrequency] = useState(item.frequency);
  const [days, setDays] = useState(String(item.duration_days));

  const update = useMutation({
    mutationFn: () =>
      api(`/api/prescription-items/${item.item_id}`, {
        method: 'PATCH',
        json: { dosage, frequency, duration_days: Number(days) },
      }),
    onSuccess: () => {
      toast.success('Prescription updated', { description: 'The change was written to the audit log.' });
      qc.invalidateQueries({ queryKey: ['patient'] });
      setEditing(false);
    },
    onError: toastError,
  });
  const remove = useMutation({
    mutationFn: () => api(`/api/prescription-items/${item.item_id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`${item.name} removed`, { description: 'Stock was returned and the deletion was audited.' });
      qc.invalidateQueries({ queryKey: ['patient'] });
      setConfirming(false);
    },
    onError: (e) => {
      toastError(e);
      setConfirming(false);
    },
  });

  if (editing) {
    return (
      <li className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_1fr_1fr_0.6fr_auto] sm:items-end">
        <p className="text-sm font-semibold text-ink sm:self-center">
          {item.name} <span className="font-normal text-ink-2">{item.strength}</span>
        </p>
        <label className="text-xs text-ink-3">
          Dosage
          <Input className="mt-1" value={dosage} maxLength={40} onChange={(e) => setDosage(e.target.value)} />
        </label>
        <label className="text-xs text-ink-3">
          Frequency
          <Select className="mt-1" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQUENCIES.map((f) => (
              <option key={f.code} value={f.code}>
                {f.code}: {f.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs text-ink-3">
          Days
          <Input className="num mt-1" type="number" min={1} max={180} value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
        <div className="flex gap-1">
          <Button size="sm" variant="primary" loading={update.isPending} icon={<Check className="size-4" />} onClick={() => update.mutate()}>
            Save
          </Button>
          <IconButton label="Cancel editing" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </IconButton>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-sm">
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-ink">{item.name}</span> <span className="text-ink-2">{item.strength}</span>
        <span className="ml-1 text-xs text-ink-3">{item.form}</span>
      </span>
      <span className="num font-mono text-[13px] text-ink-2">{item.dosage}</span>
      <span className="text-ink-2" title={freqLabel(item.frequency)}>
        <span className="font-mono text-[13px] font-semibold">{item.frequency}</span>{' '}
        <span className="hidden text-xs text-ink-3 sm:inline">{freqLabel(item.frequency).toLowerCase()}</span>
      </span>
      <span className="num text-ink-2">{item.duration_days} days</span>
      {canEdit && (
        <span className="flex gap-0.5">
          <IconButton label={`Edit ${item.name}`} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label={`Remove ${item.name}`} onClick={() => setConfirming(true)}>
            <Trash2 className="size-4" />
          </IconButton>
        </span>
      )}
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Remove ${item.name} from this prescription?`}
        footer={
          <>
            <Button onClick={() => setConfirming(false)}>Keep it</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Remove medication
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          The reserved units go back to stock (trg_rx_items_restock) and the deleted line is kept in the audit log with its old
          values.
        </p>
      </Dialog>
    </li>
  );
}

function AddPrescription({ visitId, onDone }: { visitId: number; onDone: () => void }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [notes, setNotes] = useState('');
  const save = useMutation({
    mutationFn: () =>
      api(`/api/visits/${visitId}/prescriptions`, {
        method: 'POST',
        json: {
          notes: notes.trim() || null,
          items: items.map((i) => ({
            medication_id: i.medication.medication_id,
            dosage: i.dosage,
            frequency: i.frequency,
            duration_days: i.duration_days,
          })),
        },
      }),
    onSuccess: () => {
      toast.success('Prescription added');
      qc.invalidateQueries({ queryKey: ['patient'] });
      onDone();
    },
    onError: toastError,
  });
  return (
    <div className="rounded-lg border border-ref/30 bg-ref-soft/30 p-4">
      <p className="mb-3 text-sm font-semibold">New prescription for this visit</p>
      <PrescriptionBuilder items={items} onChange={setItems} />
      <Textarea className="mt-3" rows={2} placeholder="Notes for the patient (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-3 flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button variant="primary" disabled={items.length === 0} loading={save.isPending} onClick={() => save.mutate()}>
          Save prescription
        </Button>
      </div>
    </div>
  );
}

function LabsTab({ series }: { series: ReturnType<typeof groupLabs> }) {
  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <Empty icon={<FlaskConical className="size-8" />} title="No lab results on record">
          Results entered during a consultation appear here, graded against their reference range.
        </Empty>
      </div>
    );
  }
  const trends = series.filter((s) => s.points.length >= 2);
  const singles = series.filter((s) => s.points.length < 2);
  return (
    <div className="space-y-5">
      {trends.length > 0 && (
        <>
          <StatusLegend />
          <div className="grid gap-4 md:grid-cols-2">
            {trends.map((s) => (
              <LabTrendChart key={s.test} series={s} />
            ))}
          </div>
        </>
      )}
      {singles.length > 0 && (
        <Panel title={trends.length ? 'Single results' : 'Lab results'} bodyClassName="p-0">
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Test</th>
                  <th className={`${table.th} text-right`}>Result</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Reference</th>
                  <th className={table.th}>Status</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {singles.map((s) => {
                  const p = s.points[0];
                  return (
                    <tr key={s.test} className={table.row}>
                      <td className={`${table.td} font-semibold`}>{s.test}</td>
                      <td className={`${table.td} num text-right`}>
                        {Number(p.result_value.toFixed(3))} <span className="text-xs text-ink-3">{p.unit}</span>
                      </td>
                      <td className={`${table.td} hidden font-mono text-[13px] text-ink-2 sm:table-cell`}>{p.ref_range ?? '—'}</td>
                      <td className={table.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className={`${table.td} hidden text-ink-2 sm:table-cell`}>{fmt.date(p.tested_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function AppointmentsTab({ appointments }: { appointments: PatientRecord['appointments'] }) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <Empty title="No appointments yet" />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className={table.wrap}>
        <table className={table.table}>
          <thead>
            <tr>
              <th className={table.th}>When</th>
              <th className={table.th}>Doctor</th>
              <th className={`${table.th} hidden md:table-cell`}>Reason</th>
              <th className={table.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.appointment_id} className={table.row}>
                <td className={`${table.td} num whitespace-nowrap`}>{fmt.dateTime(a.scheduled_at)}</td>
                <td className={table.td}>
                  <span className="font-semibold">Dr. {a.doctor_name}</span>
                  <span className="block text-xs text-ink-3">{a.department}</span>
                </td>
                <td className={`${table.td} hidden max-w-[40ch] truncate text-ink-2 md:table-cell`}>{a.reason ?? '—'}</td>
                <td className={table.td}>
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
