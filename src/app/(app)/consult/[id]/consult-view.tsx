'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, FileHeart, FlaskConical, NotebookPen, Pill, Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PrescriptionBuilder, type DraftItem } from '@/components/clinical/prescription-builder';
import type { Outcome, PatientRecord, ScheduleRow, SimilarCase, SimilarResponse } from '@/components/clinical/types';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  cx,
  Empty,
  Field,
  IconButton,
  Input,
  PageHeader,
  Panel,
  Select,
  SimilarityBar,
  Skeleton,
  Spinner,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { api, fmt, toastError } from '@/lib/client';

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'improving', label: 'Improving' },
  { value: 'unchanged', label: 'Unchanged' },
  { value: 'referred', label: 'Referred' },
  { value: 'admitted', label: 'Admitted' },
];

/** Common tests: picking one fills the unit and a reference range the lab trigger can grade. */
const LAB_PRESETS: Record<string, { unit: string; ref: string }> = {
  Hemoglobin: { unit: 'g/dL', ref: '12-16' },
  'Fasting blood glucose': { unit: 'mg/dL', ref: '70-100' },
  HbA1c: { unit: '%', ref: '4-5.6' },
  'Platelet count': { unit: 'x10^3/uL', ref: '150-450' },
  'WBC count': { unit: 'x10^3/uL', ref: '4-11' },
  'Troponin I': { unit: 'ng/mL', ref: '<0.04' },
  'Serum creatinine': { unit: 'mg/dL', ref: '0.6-1.2' },
  TSH: { unit: 'mIU/L', ref: '0.4-4' },
  'C-reactive protein': { unit: 'mg/L', ref: '<5' },
  'Total cholesterol': { unit: 'mg/dL', ref: '<200' },
};

interface DraftLab {
  key: string;
  test_name: string;
  result_value: string;
  unit: string;
  ref_range: string;
}

let labSeq = 0;
const newLab = (): DraftLab => ({ key: `lab-${++labSeq}`, test_name: '', result_value: '', unit: '', ref_range: '' });

export function ConsultView({ appointmentId, userId }: { appointmentId: number; userId: number }) {
  const appt = useQuery({
    queryKey: ['appointments', 'one', appointmentId],
    queryFn: () => api<ScheduleRow>(`/api/appointments/${appointmentId}`),
  });
  const patientId = appt.data?.patient_id;
  const record = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api<PatientRecord>(`/api/patients/${patientId}`),
    enabled: !!patientId,
  });

  if (appt.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Skeleton className="h-80" />
        <Skeleton className="h-[520px]" />
      </div>
    );
  }
  if (appt.isError || !appt.data) {
    return (
      <Empty
        title="This appointment couldn’t be opened"
        action={<ButtonLink href="/appointments">Back to schedule</ButtonLink>}
      >
        {(appt.error as Error | null)?.message ?? 'It may have been removed.'}
      </Empty>
    );
  }

  const a = appt.data;
  const today = fmt.isoDay(0);
  let blocked: { title: string; body: string } | null = null;
  if (a.doctor_id !== userId) {
    blocked = { title: `This appointment is with Dr. ${a.doctor_name}`, body: 'Only the assigned doctor can record the visit.' };
  } else if (a.status !== 'scheduled') {
    blocked = {
      title: `This appointment is already ${a.status === 'no_show' ? 'marked as a no-show' : a.status}`,
      body: a.status === 'completed' ? 'The visit has been recorded. Open the record to review or amend it.' : 'Nothing more can be recorded against it.',
    };
  } else if (a.local_date > today) {
    blocked = {
      title: `This appointment is on ${fmt.date(a.scheduled_at)}`,
      body: 'A visit can be recorded from the appointment day onward; sp_record_visit enforces this.',
    };
  }

  return (
    <>
      <PageHeader
        title={a.patient_name}
        description={
          <>
            Consultation at {fmt.time(a.scheduled_at)} on {fmt.date(a.scheduled_at)}
            {a.reason ? `. Reason given: “${a.reason}”` : ''}
          </>
        }
        actions={
          <ButtonLink href={`/patients/${a.patient_id}`} icon={<FileHeart className="size-4" />}>
            Open full record
          </ButtonLink>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PatientColumn appt={a} record={record.data} loading={record.isLoading} />
        {blocked ? (
          <div className="rounded-xl border border-line bg-surface">
            <Empty
              icon={<NotebookPen className="size-8" />}
              title={blocked.title}
              action={
                <div className="flex gap-2">
                  <ButtonLink href="/appointments">Back to schedule</ButtonLink>
                  <ButtonLink href={`/patients/${a.patient_id}`} variant="primary">
                    Open record
                  </ButtonLink>
                </div>
              }
            >
              {blocked.body}
            </Empty>
          </div>
        ) : (
          <VisitForm appt={a} />
        )}
      </div>
    </>
  );
}

function PatientColumn({ appt, record, loading }: { appt: ScheduleRow; record?: PatientRecord; loading: boolean }) {
  const recent = record?.visits.slice(0, 4) ?? [];
  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <Avatar name={appt.patient_name} tone="ref" size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold">{appt.patient_name}</p>
            <p className="text-sm text-ink-2 capitalize">
              {appt.patient_age} years, {appt.patient_gender}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-ink-3">Blood group</dt>
            <dd className="font-semibold">{appt.blood_group ?? 'Not recorded'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Phone</dt>
            <dd className="num font-mono text-[13px]">{appt.patient_phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Visits on record</dt>
            <dd className="num font-semibold">{record ? record.visits.length : '…'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Emergency contact</dt>
            <dd className="num font-mono text-[13px]">{record?.profile.emergency_contact ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-surface">
        <h2 className="border-b border-line px-4 py-3 text-[15px] font-bold">Recent history</h2>
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : recent.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-3">First visit: nothing on record yet.</p>
        ) : (
          <ol className="divide-y divide-line">
            {recent.map((v) => {
              const meds = v.prescriptions.flatMap((p) => p.items.map((i) => i.name));
              return (
                <li key={v.visit_id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{v.diagnosis ?? 'No diagnosis recorded'}</p>
                    <StatusBadge status={v.outcome} />
                  </div>
                  <p className="text-xs text-ink-3">
                    {fmt.date(v.created_at)}, Dr. {v.doctor_name}
                  </p>
                  {meds.length > 0 && <p className="mt-1 line-clamp-2 text-xs text-ink-2">{meds.join(', ')}</p>}
                  {v.labs.some((l) => l.status !== 'normal') && (
                    <p className="mt-1 text-xs text-warn">
                      {v.labs.filter((l) => l.status !== 'normal').map((l) => `${l.test_name} ${l.status}`).join(', ')}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </aside>
  );
}

function VisitForm({ appt }: { appt: ScheduleRow }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [debouncedNote, setDebouncedNote] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [outcome, setOutcome] = useState<Outcome | ''>('');
  const [followUp, setFollowUp] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [rxNotes, setRxNotes] = useState('');
  const [labs, setLabs] = useState<DraftLab[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedNote(note.trim()), 700);
    return () => clearTimeout(t);
  }, [note]);

  const similar = useQuery({
    queryKey: ['similar', 'consult', debouncedNote],
    queryFn: () => api<SimilarResponse>('/api/triage/similar', { method: 'POST', json: { note: debouncedNote, k: 6 } }),
    enabled: debouncedNote.length >= 25,
    placeholderData: (prev) => prev,
  });

  const save = useMutation({
    mutationFn: () =>
      api<{ visit_id: number; prescription_id: number | null }>('/api/visits', {
        method: 'POST',
        json: {
          appointment_id: appt.appointment_id,
          symptom_note: note.trim(),
          diagnosis: diagnosis.trim() || null,
          outcome: outcome || null,
          follow_up_date: followUp || null,
          prescription: items.length
            ? {
                notes: rxNotes.trim() || null,
                items: items.map((i) => ({
                  medication_id: i.medication.medication_id,
                  dosage: i.dosage,
                  frequency: i.frequency,
                  duration_days: i.duration_days,
                })),
              }
            : null,
          labs: labs
            .filter((l) => l.test_name.trim())
            .map((l) => ({
              test_name: l.test_name.trim(),
              result_value: Number(l.result_value),
              unit: l.unit.trim() || null,
              ref_range: l.ref_range.trim() || null,
            })),
        },
      }),
    onSuccess: () => {
      const parts = [items.length ? `${items.length} medication${items.length > 1 ? 's' : ''}` : null, labs.filter((l) => l.test_name.trim()).length ? 'lab results' : null].filter(Boolean);
      toast.success('Visit saved', { description: parts.length ? `Recorded with ${parts.join(' and ')}.` : 'The appointment is now completed.' });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['patient'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/patients/${appt.patient_id}`);
    },
    onError: toastError,
  });

  const noteTooShort = note.trim().length < 10;
  const badLab = labs.some((l) => l.test_name.trim() && (l.result_value.trim() === '' || Number.isNaN(Number(l.result_value))));
  const updateLab = (key: string, patch: Partial<DraftLab>) =>
    setLabs((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!noteTooShort && !badLab) save.mutate();
        }}
      >
        <Panel title="Presenting complaint" description="Write it as you normally would. Similar past cases update as you type.">
          <Textarea
            aria-label="Symptom note"
            rows={7}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="c/o burning retrosternal discomfort after meals x 3 weeks, worse lying down, sour taste in mouth. No exertional pain. BP 128/82, afebrile."
          />
          <p className={cx('mt-1.5 text-xs', noteTooShort && note.length > 0 ? 'text-warn' : 'text-ink-3')}>
            {note.trim().length} characters. The database requires at least 10 (CHECK chk_visit_note).
          </p>
        </Panel>

        <Panel title="Assessment">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Diagnosis" className="sm:col-span-2">
              {(id) => (
                <Input id={id} maxLength={200} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Working diagnosis" />
              )}
            </Field>
            {similar.data && similar.data.conditions.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs text-ink-3">Closest knowledge-base conditions for this note</p>
                <div className="flex flex-wrap gap-1.5">
                  {similar.data.conditions.slice(0, 5).map((c) => (
                    <button
                      key={c.condition_id}
                      type="button"
                      onClick={() => setDiagnosis(c.name)}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] transition-colors',
                        diagnosis === c.name ? 'border-vector bg-vector-soft text-vector' : 'border-line bg-surface text-ink-2 hover:border-vector/50',
                      )}
                    >
                      {c.name}
                      {c.similarity != null && <span className="num font-mono text-[11px] text-vector">{c.similarity.toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Field label="Outcome so far">
              {(id) => (
                <Select id={id} value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome | '')}>
                  <option value="">Not recorded</option>
                  {OUTCOMES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Follow-up date" hint="Optional. Cannot be before today (CHECK chk_visit_followup).">
              {(id) => <Input id={id} type="date" min={fmt.isoDay(0)} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />}
            </Field>
          </div>
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <Pill className="size-4 text-ref" /> Prescription
            </span>
          }
          description="Each line reserves stock and is checked for interactions by a trigger when saved."
        >
          <PrescriptionBuilder items={items} onChange={setItems} />
          {items.length > 0 && (
            <Field label="Notes for the patient" className="mt-4">
              {(id) => <Textarea id={id} rows={2} value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} placeholder="For example: take after food" />}
            </Field>
          )}
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <FlaskConical className="size-4 text-core" /> Lab results
            </span>
          }
          description="Status (normal, abnormal, critical) is graded from the reference range by trg_lab_status."
          actions={
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setLabs((l) => [...l, newLab()])}>
              Add result
            </Button>
          }
        >
          {labs.length === 0 ? (
            <p className="text-sm text-ink-3">No lab results for this visit. Add one if tests were done today.</p>
          ) : (
            <div className="space-y-3">
              <datalist id="lab-presets">
                {Object.keys(LAB_PRESETS).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {labs.map((l) => (
                <div key={l.key} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_auto] sm:items-end">
                  <label className="col-span-2 text-xs text-ink-3 sm:col-span-1">
                    Test
                    <Input
                      className="mt-1"
                      list="lab-presets"
                      value={l.test_name}
                      maxLength={80}
                      onChange={(e) => {
                        const preset = LAB_PRESETS[e.target.value];
                        updateLab(l.key, {
                          test_name: e.target.value,
                          ...(preset && !l.unit ? { unit: preset.unit } : {}),
                          ...(preset && !l.ref_range ? { ref_range: preset.ref } : {}),
                        });
                      }}
                    />
                  </label>
                  <label className="text-xs text-ink-3">
                    Value
                    <Input className="num mt-1" inputMode="decimal" value={l.result_value} onChange={(e) => updateLab(l.key, { result_value: e.target.value })} />
                  </label>
                  <label className="text-xs text-ink-3">
                    Unit
                    <Input className="mt-1" maxLength={20} value={l.unit} onChange={(e) => updateLab(l.key, { unit: e.target.value })} />
                  </label>
                  <label className="text-xs text-ink-3">
                    Reference
                    <Input className="mt-1 font-mono" placeholder="70-100" maxLength={40} value={l.ref_range} onChange={(e) => updateLab(l.key, { ref_range: e.target.value })} />
                  </label>
                  <IconButton label="Remove result" className="justify-self-end" onClick={() => setLabs((ls) => ls.filter((x) => x.key !== l.key))}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
              {badLab && <p className="text-xs text-warn">Each result needs a numeric value.</p>}
            </div>
          )}
        </Panel>

        <div className="flex flex-col-reverse items-start gap-3 rounded-xl border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] text-[13px] text-ink-3">
            The visit, prescription and lab results are saved in one transaction: if any part is rejected, nothing is saved.
          </p>
          <Button type="submit" variant="primary" loading={save.isPending} disabled={noteTooShort || badLab} icon={<Save className="size-4" />}>
            Save visit
          </Button>
        </div>
      </form>

      <SimilarPanel query={debouncedNote} data={similar.data} loading={similar.isFetching} error={similar.error as Error | null} />
    </div>
  );
}

function SimilarPanel({
  query,
  data,
  loading,
  error,
}: {
  query: string;
  data?: SimilarResponse;
  loading: boolean;
  error: Error | null;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const top = useMemo(() => data?.distribution.slice(0, 3) ?? [], [data]);
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <section className="rounded-xl border border-vector/25 bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="inline-flex items-center gap-2 text-[15px] font-bold">
            <Activity className="size-4 text-vector" /> Similar past cases
          </h2>
          {loading && <Spinner />}
        </div>
        {query.length < 25 ? (
          <p className="px-4 py-5 text-sm text-ink-3">
            Keep typing the note. Once it is a sentence or two long, the closest past visits appear here, ranked by cosine
            similarity of their embeddings.
          </p>
        ) : error ? (
          <p className="px-4 py-5 text-sm text-danger">{error.message}</p>
        ) : !data ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : data.cases.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-3">No past visits have embeddings yet.</p>
        ) : (
          <>
            {top.length > 0 && (
              <p className="border-b border-line px-4 py-2.5 text-[13px] text-ink-2">
                Of the {data.cases.length} closest:{' '}
                {top.map((t, i) => (
                  <span key={t.diagnosis}>
                    {i > 0 ? ', ' : ''}
                    <span className="font-semibold">{t.diagnosis}</span> ({t.count})
                  </span>
                ))}
              </p>
            )}
            <ol className="divide-y divide-line">
              {data.cases.map((c) => (
                <CaseItem key={c.visit_id} c={c} open={expanded === c.visit_id} onToggle={() => setExpanded((e) => (e === c.visit_id ? null : c.visit_id))} />
              ))}
            </ol>
            <p className="border-t border-line px-4 py-2 text-[11px] text-ink-3">
              Embedded in {data.timings.embed_ms} ms, searched in {data.timings.sql_ms} ms. Patient identities are not shown.
            </p>
          </>
        )}
      </section>
    </aside>
  );
}

function CaseItem({ c, open, onToggle }: { c: SimilarCase; open: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full px-4 py-3 text-left hover:bg-muted/60">
        <div className="flex items-center justify-between gap-2">
          <SimilarityBar value={c.similarity} />
          <StatusBadge status={c.outcome} />
        </div>
        <p className="mt-1.5 text-sm font-semibold text-ink">{c.diagnosis ?? 'Undiagnosed'}</p>
        <p className="text-xs text-ink-3 capitalize">
          {c.patient_age} y {c.patient_gender}, {c.department}, {fmt.date(c.visit_date)}
        </p>
        <p className={cx('mt-1 text-[13px] text-ink-2', open ? '' : 'line-clamp-2')}>{c.symptom_note}</p>
        {open && (
          <div className="mt-2 space-y-1 text-[13px]">
            <p>
              <span className="text-ink-3">Treatment: </span>
              {c.treatment ?? 'No prescription'}
            </p>
            {c.labs && (
              <p>
                <span className="text-ink-3">Labs: </span>
                {c.labs}
              </p>
            )}
          </div>
        )}
        {!open && c.abnormal_labs > 0 && (
          <Badge tone="warn" className="mt-1.5">
            {c.abnormal_labs} abnormal lab{c.abnormal_labs > 1 ? 's' : ''}
          </Badge>
        )}
      </button>
    </li>
  );
}
