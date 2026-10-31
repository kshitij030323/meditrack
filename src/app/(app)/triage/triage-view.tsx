'use client';

import { useMutation } from '@tanstack/react-query';
import { Activity, AlertTriangle, ChevronDown, Sparkles, Square } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Answer, ProviderNote, SourceList, useRagStream } from '@/components/answer';
import { BarList } from '@/components/charts';
import {
  Badge,
  Button,
  cx,
  Empty,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  SimilarityBar,
  Skeleton,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { api, fmt, toastError } from '@/lib/client';

interface CaseHit {
  visit_id: number;
  visit_date: string;
  symptom_note: string;
  diagnosis: string | null;
  outcome: string | null;
  patient_age: number;
  patient_gender: string;
  department: string;
  treatment: string | null;
  labs: string | null;
  abnormal_labs: number;
  similarity: number;
}

interface ConditionHit {
  condition_id: number;
  name: string;
  description: string;
  red_flags: string | null;
  similarity: number | null;
}

interface SimilarResponse {
  cases: CaseHit[];
  conditions: ConditionHit[];
  distribution: { diagnosis: string; count: number; best: number }[];
  timings: { embed_ms: number; sql_ms: number };
}

const EXAMPLES = [
  '54 y M, burning pain behind the breastbone after heavy dinners, sour taste in the mouth, worse lying flat, 3 weeks',
  'Crushing central chest pressure for 40 minutes spreading to the left arm and jaw, sweaty and nauseous',
  'High fever for 4 days with severe body ache, pain behind the eyes and a faint rash on the arms',
  'Always thirsty, passing urine many times at night, lost 4 kg without trying, blurred vision',
];

export function TriageView({ initialNote }: { initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [active, setActive] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const assessment = useRagStream('/api/triage/assess');
  const resultsRef = useRef<HTMLDivElement>(null);

  const search = useMutation({
    mutationFn: (text: string) => api<SimilarResponse>('/api/triage/similar', { method: 'POST', json: { note: text, k: 12 } }),
    onError: toastError,
  });

  const run = (text = note) => {
    if (text.trim().length < 10) return;
    assessment.reset();
    search.mutate(text.trim());
  };

  useEffect(() => {
    if (initialNote.trim().length >= 10) run(initialNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = search.data;
  const canAssess = note.trim().length >= 10;

  return (
    <>
      <PageHeader
        title="Triage"
        description="Describe the presentation in your own words. MediTrack turns the note into a vector and finds the recorded visits that read most like it, along with how they were diagnosed and treated."
      />

      <section className="rounded-xl border border-line bg-surface p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <label htmlFor="triage-note" className="text-[13px] font-semibold text-ink-2">
            Symptom note
          </label>
          <Textarea
            id="triage-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run();
            }}
            placeholder="What the patient reports, how long, what makes it better or worse, relevant findings"
            className="mt-1.5 text-[16px]"
          />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Age" className="w-24">
              {(id) => <Input id={id} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} />}
            </Field>
            <Field label="Sex" className="w-32">
              {(id) => (
                <Select id={id} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Not given</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </Select>
              )}
            </Field>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button type="submit" variant="vector" icon={<Activity className="size-4" />} loading={search.isPending} disabled={!canAssess}>
                Find similar cases
              </Button>
            </div>
          </div>
        </form>
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[13px] text-ink-3">Try an example presentation</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setNote(ex);
                  run(ex);
                }}
                className="max-w-full truncate rounded-full border border-line bg-muted px-3 py-1 text-left text-[13px] text-ink-2 hover:border-vector/40 hover:text-ink sm:max-w-[22rem]"
                title={ex}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div ref={resultsRef} className="mt-6">
        {search.isPending && <ResultsSkeleton />}
        {!search.isPending && !data && (
          <Empty
            icon={<Activity className="size-7" />}
            title="Similar cases appear here"
            className="rounded-xl border border-dashed border-line-strong"
          >
            Write or pick a presentation above. Nothing is saved: triage searches are read-only.
          </Empty>
        )}
        {!search.isPending && data && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <Panel
                title="Case constellation"
                description={`The ${data.cases.length} nearest recorded visits. Closer to the centre means a more similar note; sectors group cases by final diagnosis.`}
              >
                <Constellation cases={data.cases} active={active} onActive={setActive} />
                <p className="mt-3 text-xs text-ink-3">
                  Note embedded in {data.timings.embed_ms} ms with all-MiniLM-L6-v2; nearest neighbours found in {data.timings.sql_ms} ms
                  by cosine distance (pgvector HNSW index on visits.note_embedding).
                </p>
              </Panel>

              <Panel title="Closest past cases" description="De-identified: age, sex and department only" bodyClassName="p-0">
                <ol className="divide-y divide-line">
                  {data.cases.map((c, i) => (
                    <CaseRow key={c.visit_id} c={c} rank={i + 1} active={active === c.visit_id} onHover={setActive} />
                  ))}
                </ol>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="What similar cases turned out to be" description="Final diagnoses among the nearest cases">
                <BarList
                  color="var(--vector)"
                  items={data.distribution.map((d) => ({
                    label: d.diagnosis,
                    value: d.count,
                    hint: `Best match ${d.best.toFixed(2)}`,
                  }))}
                />
              </Panel>

              <Panel
                title="AI triage assessment"
                description="Retrieval-augmented: grounded in the knowledge base and these cases"
                actions={
                  assessment.streaming ? (
                    <Button size="sm" onClick={assessment.stop} icon={<Square className="size-3.5" />}>
                      Stop
                    </Button>
                  ) : null
                }
              >
                {!assessment.text && !assessment.streaming && !assessment.error ? (
                  <div>
                    <p className="text-sm text-ink-2">
                      Drafts an urgency level, differential, red flags and next steps, citing the records it used. Decision
                      support only; the diagnosis is yours.
                    </p>
                    <Button
                      variant="vector"
                      className="mt-3"
                      icon={<Sparkles className="size-4" />}
                      onClick={() =>
                        assessment.start({ note: note.trim(), age: age ? Number(age) : null, gender: gender || null })
                      }
                    >
                      Draft assessment
                    </Button>
                  </div>
                ) : (
                  <div>
                    {assessment.text ? (
                      <Answer
                        text={assessment.text}
                        sources={assessment.sources}
                        streaming={assessment.streaming}
                        onCite={(k) => {
                          setHighlight(k);
                          document.getElementById(`source-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                      />
                    ) : (
                      <p className="text-sm text-ink-3">Retrieving records and starting the model…</p>
                    )}
                    {assessment.error && <p className="mt-2 text-sm text-danger">{assessment.error}</p>}
                    <div className="mt-3 border-t border-line pt-2">
                      <ProviderNote llm={assessment.llm} />
                    </div>
                    {assessment.sources.length > 0 && (
                      <details className="group mt-3" open={!!highlight}>
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-ink-2">
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                          {assessment.sources.length} records in context
                        </summary>
                        <div className="mt-2">
                          <SourceList sources={assessment.sources} highlight={highlight} />
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title="Matching conditions" description="Knowledge-base entries nearest to the note" bodyClassName="p-0">
                <ul className="divide-y divide-line">
                  {data.conditions.map((c) => (
                    <li key={c.condition_id} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/search?q=${encodeURIComponent(c.name)}&open=${c.condition_id}`}
                          className="min-w-0 flex-1 truncate font-semibold hover:underline"
                        >
                          {c.name}
                        </Link>
                        <SimilarityBar value={c.similarity} />
                      </div>
                      {c.red_flags && (
                        <p className="mt-1.5 flex gap-1.5 text-[13px] leading-snug text-ink-2">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="Red flags" />
                          {c.red_flags}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <Skeleton className="h-[460px]" />
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}

function CaseRow({
  c,
  rank,
  active,
  onHover,
}: {
  c: CaseHit;
  rank: number;
  active: boolean;
  onHover: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li
      id={`case-${c.visit_id}`}
      onPointerEnter={() => onHover(c.visit_id)}
      onPointerLeave={() => onHover(null)}
      className={cx('px-5 py-3.5 transition-colors', active && 'bg-vector-soft/50')}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="num w-5 font-mono text-xs text-ink-3">{rank}</span>
        <span className="font-semibold">{c.diagnosis ?? 'Undiagnosed'}</span>
        <StatusBadge status={c.outcome} />
        <span className="ml-auto">
          <SimilarityBar value={c.similarity} />
        </span>
      </div>
      <p className="mt-0.5 pl-8 text-xs text-ink-3">
        {c.patient_age} y {c.patient_gender}, {c.department}, {fmt.date(c.visit_date)}
      </p>
      <p className={cx('mt-1.5 pl-8 text-[14px] leading-snug text-ink-2', !open && 'line-clamp-2')}>{c.symptom_note}</p>
      {open && (
        <dl className="mt-2 space-y-1 pl-8 text-[13px]">
          <div>
            <dt className="inline font-semibold text-ink-2">Treatment: </dt>
            <dd className="inline font-mono text-ink">{c.treatment ?? 'None prescribed'}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink-2">Labs: </dt>
            <dd className="inline text-ink">{c.labs ?? 'None'}</dd>
          </div>
        </dl>
      )}
      <div className="mt-1 flex items-center gap-2 pl-8">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-[13px] font-semibold text-vector hover:underline">
          {open ? 'Show less' : 'Show treatment and labs'}
        </button>
        {c.abnormal_labs > 0 && <Badge tone="warn">{c.abnormal_labs} abnormal labs</Badge>}
      </div>
    </li>
  );
}

/** "Gastroesophageal reflux disease (GERD)" -> "GERD"; long names are cut at a word. */
function shortLabel(dx: string): string {
  const abbr = dx.match(/\(([A-Z0-9-]{2,8})\)/);
  if (abbr) return abbr[1];
  const plain = dx.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (plain.length <= 24) return plain;
  return `${plain.slice(0, 23).replace(/\s+\S*$/, '')}…`;
}

/**
 * Radial similarity plot. Radius encodes cosine similarity (centre = the new
 * note); each final diagnosis owns an angular sector sized by its case count.
 */
function Constellation({
  cases,
  active,
  onActive,
}: {
  cases: CaseHit[];
  active: number | null;
  onActive: (id: number | null) => void;
}) {
  const W = 720;
  const H = 440;
  const cx0 = W / 2;
  const cy0 = H / 2 + 6;
  const rMin = 46;
  const rMax = 170;
  const floor = 0.2;
  const radius = (s: number) => rMin + (Math.min(1, Math.max(0, (1 - s) / (1 - floor)))) * (rMax - rMin);

  const layout = useMemo(() => {
    const groups = new Map<string, CaseHit[]>();
    for (const c of cases) {
      const k = c.diagnosis ?? 'Undiagnosed';
      groups.set(k, [...(groups.get(k) ?? []), c]);
    }
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || b[1][0].similarity - a[1][0].similarity);
    const total = cases.length || 1;
    let angle = -Math.PI / 2;
    const points: { c: CaseHit; x: number; y: number; r: number }[] = [];
    const labels: { text: string; x: number; y: number; anchor: 'start' | 'end' | 'middle'; mid: number }[] = [];
    for (const [dx, list] of ordered) {
      const span = (list.length / total) * Math.PI * 2;
      list.forEach((c, i) => {
        const a = angle + span * ((i + 0.5) / list.length);
        const r = radius(c.similarity);
        points.push({ c, x: cx0 + Math.cos(a) * r, y: cy0 + Math.sin(a) * r, r });
      });
      const mid = angle + span / 2;
      const lr = rMax + 22;
      const cos = Math.cos(mid);
      labels.push({
        text: shortLabel(dx),
        x: cx0 + cos * lr,
        y: cy0 + Math.sin(mid) * lr,
        anchor: Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end',
        mid,
      });
      angle += span;
    }
    return { points, labels, sectors: ordered.length };
  }, [cases]);

  const nearest = [...layout.points].sort((a, b) => b.c.similarity - a.c.similarity).slice(0, 3);
  const focus = layout.points.find((p) => p.c.visit_id === active);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[760px]" role="img" aria-label="Similar cases plotted by similarity and diagnosis">
        {[0.8, 0.6, 0.4].map((s) => (
          <g key={s}>
            <circle cx={cx0} cy={cy0} r={radius(s)} fill="none" stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={cx0 + 4} y={cy0 - radius(s) - 4} className="fill-ink-3 text-[10px]">
              {s.toFixed(1)}
            </text>
          </g>
        ))}
        {nearest.map((p) => (
          <line key={`l${p.c.visit_id}`} x1={cx0} y1={cy0} x2={p.x} y2={p.y} stroke="var(--vector)" strokeOpacity={0.35} strokeWidth={1.5} />
        ))}
        {layout.labels.map((l) => (
          <text key={l.text + l.mid} x={l.x} y={l.y} textAnchor={l.anchor} dy="0.32em" className="fill-ink-2 text-[11.5px] font-semibold">
            {l.text}
          </text>
        ))}
        {layout.points.map((p) => {
          const isActive = p.c.visit_id === active;
          const strength = Math.max(0.3, Math.min(1, (p.c.similarity - floor) / (1 - floor)));
          return (
            <g
              key={p.c.visit_id}
              tabIndex={0}
              role="button"
              aria-label={`${p.c.diagnosis ?? 'Undiagnosed'}, similarity ${p.c.similarity.toFixed(2)}`}
              onPointerEnter={() => onActive(p.c.visit_id)}
              onPointerLeave={() => onActive(null)}
              onFocus={() => onActive(p.c.visit_id)}
              onBlur={() => onActive(null)}
              onClick={() => document.getElementById(`case-${p.c.visit_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="cursor-pointer outline-none"
            >
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 9 : 6.5}
                fill="var(--vector)"
                fillOpacity={strength}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          );
        })}
        <circle cx={cx0} cy={cy0} r={13} fill="var(--surface)" stroke="var(--core)" strokeWidth={3} />
        <circle cx={cx0} cy={cy0} r={4} fill="var(--core)" />
      </svg>
      {focus && (
        <div
          className="pointer-events-none absolute z-10 w-60 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-pop"
          style={{ left: `${(focus.x / W) * 100}%`, top: `${(focus.y / H) * 100}%`, transform: 'translate(-50%, calc(-100% - 14px))' }}
        >
          <p className="num font-mono font-bold text-ink">{focus.c.similarity.toFixed(3)}</p>
          <p className="font-semibold text-ink">{focus.c.diagnosis ?? 'Undiagnosed'}</p>
          <p className="text-xs text-ink-3">
            {focus.c.patient_age} y {focus.c.patient_gender}, {focus.c.outcome ?? 'outcome not recorded'}
          </p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border-2 border-core" /> This note
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-vector" /> Past case (darker = more similar)
        </span>
        <span>Rings mark cosine similarity 0.8, 0.6, 0.4</span>
      </div>
    </div>
  );
}
