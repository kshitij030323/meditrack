'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CircleCheck, CircleX, Database, Play, RefreshCw, Zap } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { api, fmt, RequestError, toastError } from '@/lib/client';
import {
  Badge,
  Button,
  cx,
  Empty,
  Kbd,
  PageHeader,
  Panel,
  Select,
  Skeleton,
  Spinner,
  Stat,
  table,
  Tabs,
  Textarea,
  type Tone,
} from '@/components/ui';
import { SAMPLE_QUERIES, type SampleQuery } from './sample-queries';

type Tab = 'schema' | 'console' | 'transactions';

export function DbLabView() {
  const [tab, setTab] = useState<Tab>('schema');
  return (
    <>
      <PageHeader
        title="DB Lab"
        description="Look inside the MediTrack database: the objects that enforce its rules, a read-only SQL console with the project's key queries, and a live transaction race."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { value: 'schema', label: 'Schema' },
          { value: 'console', label: 'SQL console' },
          { value: 'transactions', label: 'Transactions' },
        ]}
      />
      {tab === 'schema' && <SchemaTab />}
      {tab === 'console' && <ConsoleTab />}
      {tab === 'transactions' && <TransactionsTab />}
    </>
  );
}

const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} kB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
interface Overview {
  tables: { name: string; bytes: number; row_count: number; comment: string | null }[];
  views: { name: string; kind: string; definition: string }[];
  routines: { name: string; kind: 'function' | 'procedure' | 'trigger function'; args: string; language: string; definition: string }[];
  triggers: { name: string; table_name: string; function_name: string; definition: string }[];
  indexes: { name: string; table_name: string; method: string; bytes: number; definition: string }[];
  constraints: { name: string; table_name: string; type: string; definition: string }[];
  extensions: { name: string; version: string }[];
}

/** Colour of each table, following the legend of the relational-schema diagram. */
const TABLE_TONE: Record<string, Tone> = {
  visits: 'vector',
  conditions_kb: 'vector',
  drug_interactions: 'ref',
  prescription_audit: 'audit',
};
const VECTOR_COLUMNS: Record<string, string> = {
  visits: 'note_embedding',
  conditions_kb: 'kb_embedding',
  medications: 'med_embedding',
};
const dot: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  core: 'bg-core',
  vector: 'bg-vector',
  ref: 'bg-ref',
  audit: 'bg-audit',
  danger: 'bg-danger',
  warn: 'bg-warn',
  ok: 'bg-ok',
};
const METHOD_TONE: Record<string, Tone> = { hnsw: 'vector', gin: 'ref', btree: 'neutral' };
const ROUTINE_TONE: Record<string, Tone> = { procedure: 'core', function: 'neutral', 'trigger function': 'audit' };
const CONSTRAINT_ORDER = ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK'];

const pre = 'mt-2 max-h-80 overflow-auto rounded-md border border-line bg-muted p-3 font-mono text-[12px] leading-relaxed whitespace-pre text-ink-2';
const summary =
  'flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted [&::-webkit-details-marker]:hidden';

function SchemaTab() {
  const overview = useQuery({ queryKey: ['dblab', 'overview'], queryFn: () => api<Overview>('/api/dblab/overview') });

  if (overview.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (overview.isError || !overview.data) {
    return <Empty title="The catalog could not be read.">{(overview.error as Error)?.message}</Empty>;
  }
  const o = overview.data;
  const totalRows = o.tables.reduce((s, t) => s + t.row_count, 0);
  const byType = CONSTRAINT_ORDER.map((type) => ({ type, items: o.constraints.filter((c) => c.type === type) }));
  const routineKinds = ['procedure', 'function', 'trigger function'] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Tables" value={o.tables.length} sub={`${totalRows.toLocaleString('en-IN')} rows`} tone="core" />
        <Stat label="Views" value={o.views.length} sub={`${o.views.filter((v) => v.kind !== 'view').length} materialized`} />
        <Stat label="Functions and procedures" value={o.routines.length} sub={`${o.routines.filter((r) => r.kind === 'procedure').length} procedures`} />
        <Stat label="Triggers" value={o.triggers.length} tone="audit" />
        <Stat label="Indexes" value={o.indexes.length} sub={`${o.indexes.filter((i) => i.method === 'hnsw').length} HNSW vector`} tone="vector" />
        <Stat label="Constraints" value={o.constraints.length} sub={`${byType.find((t) => t.type === 'CHECK')?.items.length ?? 0} CHECK`} tone="ref" />
      </div>

      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        Extensions:
        {o.extensions.map((e) => (
          <Badge key={e.name} tone={e.name === 'vector' ? 'vector' : 'neutral'}>
            {e.name} {e.version}
          </Badge>
        ))}
      </p>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Tables" description="Exact row counts (count(*) per table) and total size including indexes." bodyClassName="p-0">
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Table</th>
                  <th className={cx(table.th, 'text-right')}>Rows</th>
                  <th className={cx(table.th, 'text-right')}>Size</th>
                </tr>
              </thead>
              <tbody>
                {o.tables.map((t) => (
                  <tr key={t.name} className={table.row}>
                    <td className={table.td}>
                      <span className="flex items-center gap-2">
                        <span className={cx('size-2 shrink-0 rounded-full', dot[TABLE_TONE[t.name] ?? 'core'])} aria-hidden />
                        <span className="font-mono text-[13px] text-ink">{t.name}</span>
                        {VECTOR_COLUMNS[t.name] && (
                          <Badge tone="vector" className="font-mono text-[11px] font-normal">
                            {VECTOR_COLUMNS[t.name]} VECTOR(384)
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className={cx(table.td, 'num text-right')}>{t.row_count.toLocaleString('en-IN')}</td>
                    <td className={cx(table.td, 'num text-right text-ink-3')}>{kb(t.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-2.5 text-xs text-ink-3">
            {([['core', 'Core transactional'], ['vector', 'Holds a pgvector embedding'], ['ref', 'Reference data'], ['audit', 'Trigger-populated log']] as [Tone, string][]).map(
              ([tone, label]) => (
                <span key={tone} className="inline-flex items-center gap-1.5">
                  <span className={cx('size-2 rounded-full', dot[tone])} />
                  {label}
                </span>
              ),
            )}
          </div>
        </Panel>

        <Panel title="Constraints" description="Integrity rules the database enforces on every write, whichever client sends it.">
          <div className="space-y-1">
            {byType.map(({ type, items }) => (
              <details key={type} className="group">
                <summary className={summary}>
                  <span className="flex-1 font-semibold text-ink">{type}</span>
                  <span className="num text-sm text-ink-3">{items.length}</span>
                </summary>
                <ul className="mt-1 mb-2 space-y-2 pl-2">
                  {items.map((c) => (
                    <li key={`${c.table_name}.${c.name}`} className="text-[13px]">
                      <span className="font-mono text-ink">{c.name}</span>
                      <span className="text-ink-3"> on {c.table_name}</span>
                      <div className="font-mono text-[12px] break-words text-ink-3">{c.definition}</div>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <h3 className="mt-5 mb-1 text-[15px] font-bold">Views</h3>
          <div className="space-y-1">
            {o.views.map((v) => (
              <details key={v.name}>
                <summary className={summary}>
                  <span className="flex-1 font-mono text-[13px] text-ink">{v.name}</span>
                  <Badge tone={v.kind === 'view' ? 'neutral' : 'core'}>{v.kind}</Badge>
                </summary>
                <pre className={pre}>{v.definition.trim()}</pre>
              </details>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Functions, procedures and trigger functions"
        description="Business rules written in SQL and PL/pgSQL. Open one to read its source as stored in pg_proc."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {routineKinds.map((kind) => (
            <div key={kind}>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-2">
                <Badge tone={ROUTINE_TONE[kind]}>{kind}</Badge>
                <span className="num text-ink-3">{o.routines.filter((r) => r.kind === kind).length}</span>
              </h3>
              <div className="space-y-0.5">
                {o.routines
                  .filter((r) => r.kind === kind)
                  .map((r) => (
                    <details key={`${r.name}(${r.args})`}>
                      <summary className={summary}>
                        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink" title={`${r.name}(${r.args})`}>
                          {r.name}
                          <span className="text-ink-3">({r.args ? '…' : ''})</span>
                        </span>
                        <span className="text-xs text-ink-3">{r.language}</span>
                      </summary>
                      {r.args && <p className="mt-1 px-2 font-mono text-[12px] text-ink-3">({r.args})</p>}
                      <pre className={pre}>{r.definition.trim()}</pre>
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Triggers" description="Row-level triggers that validate, adjust stock and write the audit trail." bodyClassName="p-0">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Trigger</th>
                <th className={table.th}>Table</th>
                <th className={table.th}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {o.triggers.map((t) => (
                <tr key={t.name} className={table.row}>
                  <td className={table.td}>
                    <div className={cx('font-mono text-[13px] font-semibold', t.name.includes('audit') ? 'text-audit' : 'text-ink')}>
                      {t.name}
                    </div>
                    <div className="font-mono text-[12px] text-ink-3">{t.function_name}()</div>
                  </td>
                  <td className={cx(table.td, 'font-mono text-[13px]')}>{t.table_name}</td>
                  <td className={cx(table.td, 'min-w-[28rem] font-mono text-[12px] text-ink-2')}>{t.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Indexes"
        description="B-tree for joins and schedules, GIN for full-text and trigram search, HNSW for approximate nearest-neighbour vector search."
        bodyClassName="p-0"
      >
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Index</th>
                <th className={table.th}>Method</th>
                <th className={cx(table.th, 'text-right')}>Size</th>
                <th className={table.th}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {o.indexes.map((i) => (
                <tr key={i.name} className={table.row}>
                  <td className={table.td}>
                    <div className="font-mono text-[13px] text-ink">{i.name}</div>
                    <div className="text-xs text-ink-3">{i.table_name}</div>
                  </td>
                  <td className={table.td}>
                    <Badge tone={METHOD_TONE[i.method] ?? 'neutral'}>{i.method}</Badge>
                  </td>
                  <td className={cx(table.td, 'num text-right text-ink-3')}>{kb(i.bytes)}</td>
                  <td className={cx(table.td, 'min-w-[24rem] font-mono text-[12px] text-ink-2')}>
                    {i.definition.replace(/^CREATE (UNIQUE )?INDEX \S+ ON public\./, (_m, u) => `${u ?? ''}ON `)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SQL console
// ---------------------------------------------------------------------------
interface QueryOk {
  ok: true;
  command: string;
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated: boolean;
  ms: number;
}
interface QueryErr {
  ok: false;
  error: string;
  code?: string;
  position?: string;
  hint?: string;
}

async function runSql(sql: string): Promise<QueryOk | QueryErr> {
  const res = await fetch('/api/dblab/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  if (res.status === 400 && data && data.ok === false) return data as QueryErr;
  if (!res.ok) throw new RequestError(data?.error ?? `Request failed (${res.status})`, res.status);
  return data as QueryOk;
}

function ConsoleTab() {
  const [selected, setSelected] = useState<SampleQuery>(SAMPLE_QUERIES[0]);
  const [sql, setSql] = useState(SAMPLE_QUERIES[0].sql);
  const run = useMutation({ mutationFn: runSql, onError: toastError });

  const execute = useCallback(() => {
    if (sql.trim()) run.mutate(sql);
  }, [sql, run]);

  const load = (q: SampleQuery) => {
    setSelected(q);
    setSql(q.sql);
    run.reset();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <h2 className="mb-1 text-[15px] font-bold">Important queries</h2>
        <p className="mb-3 text-[13px] text-ink-3">Pick one to load it into the editor.</p>
        <ul className="space-y-1.5">
          {SAMPLE_QUERIES.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => load(q)}
                aria-current={selected.id === q.id}
                className={cx(
                  'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                  selected.id === q.id ? 'border-core/40 bg-core-soft' : 'border-line bg-surface hover:bg-muted',
                )}
              >
                <span className="block text-sm font-semibold text-ink">{q.title}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {q.concepts.map((c) => (
                    <span key={c} className="rounded bg-muted px-1.5 py-px text-[11px] text-ink-2">
                      {c}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 space-y-4">
        <Panel
          title={selected.title}
          description={selected.description}
          actions={
            <Button variant="primary" size="sm" icon={<Play className="size-3.5" />} loading={run.isPending} onClick={execute}>
              Run query
            </Button>
          }
        >
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                execute();
              }
            }}
            rows={Math.min(22, Math.max(8, sql.split('\n').length + 1))}
            spellCheck={false}
            aria-label="SQL query"
            className="font-mono text-[13px] leading-relaxed"
          />
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            <span>
              <Kbd>⌘</Kbd> <Kbd>Enter</Kbd> runs the query.
            </span>
            <span>
              Runs as the role <code className="font-mono">meditrack_reader</code> inside a READ ONLY transaction that is
              rolled back: SELECT privileges only, no access to <code className="font-mono">users.password_hash</code>, one
              statement at a time, 5 s timeout.
            </span>
          </p>
        </Panel>

        <QueryResult state={run} />
      </div>
    </div>
  );
}

function QueryResult({ state }: { state: { data?: QueryOk | QueryErr; isPending: boolean; isIdle: boolean } }) {
  if (state.isPending) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-6 text-sm text-ink-3">
        <Spinner /> Running…
      </div>
    );
  }
  if (!state.data) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-3">
        Results appear here.
      </div>
    );
  }
  const r = state.data;
  if (!r.ok) {
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4">
        <p className="flex items-center gap-2 font-semibold text-danger">
          <CircleX className="size-4" /> The database rejected this query
        </p>
        <p className="mt-1 font-mono text-[13px] text-ink">{r.error}</p>
        <p className="mt-1 text-xs text-ink-2">
          {r.code && <>SQLSTATE {r.code}</>}
          {r.position && <>, at character {r.position}</>}
          {r.code === '42501' && ' (insufficient privilege: the console role was never granted this)'}
          {r.code === '25006' && ' (writes are blocked in a read-only transaction)'}
        </p>
        {r.hint && <p className="mt-1 text-xs text-ink-2">Hint: {r.hint}</p>}
      </div>
    );
  }

  const isPlan = r.columns.length === 1 && r.columns[0] === 'QUERY PLAN';
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-5 py-3 text-sm">
        <CircleCheck className="size-4 text-ok" />
        <span className="font-semibold text-ink">
          {isPlan ? 'Query plan' : `${r.rowCount} ${r.rowCount === 1 ? 'row' : 'rows'}`}
        </span>
        <span className="text-ink-3">
          {r.command} in {r.ms} ms
        </span>
        {r.truncated && <Badge tone="warn">Showing the first {r.rows.length}</Badge>}
      </div>
      {isPlan ? (
        <pre className="max-h-[28rem] overflow-auto p-5 font-mono text-[12px] leading-relaxed whitespace-pre text-ink-2">
          {r.rows.map((row) => String(row[0])).join('\n')}
        </pre>
      ) : r.rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-3">The query ran and returned no rows.</p>
      ) : (
        <div className="max-h-[30rem] overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {r.columns.map((c, i) => (
                  <th key={`${c}${i}`} className={cx(table.th, 'font-mono')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row, i) => (
                <tr key={i} className={table.row}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-line px-4 py-2 align-top whitespace-nowrap">
                      <Cell value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Cell({ value }: { value: unknown }): ReactNode {
  if (value === null || value === undefined) return <span className="text-ink-3 italic">null</span>;
  if (typeof value === 'boolean') return <span className="font-mono text-core">{String(value)}</span>;
  if (typeof value === 'number') return <span className="num font-mono">{value}</span>;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const short = text.length > 120 ? `${text.slice(0, 117)}…` : text;
  const isTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text);
  return (
    <span title={text.length > 120 || isTime ? text : undefined} className={cx(typeof value === 'object' && 'font-mono text-[12px]')}>
      {isTime ? fmt.dateTime(text) : short}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
interface RaceResult {
  doctor: { doctor_id: number; full_name: string };
  slot: string;
  results: {
    patient_id: number;
    patient_name: string;
    ok: boolean;
    appointment_id?: number;
    error?: string;
    code?: string;
    started_ms: number;
    finished_ms: number;
  }[];
  committed: number;
  cleaned_up: number;
}

function TransactionsTab() {
  const [attempts, setAttempts] = useState('6');
  const race = useMutation({
    mutationFn: () => api<RaceResult>('/api/dblab/concurrency', { method: 'POST', json: { attempts: Number(attempts) } }),
    onError: toastError,
  });
  const refresh = useMutation({
    mutationFn: () => api<{ ms: number; rows: number }>('/api/dblab/refresh', { method: 'POST' }),
    onError: toastError,
  });

  return (
    <div className="space-y-5">
      <Panel
        title="Concurrent booking race"
        description="Several patients try to book the same doctor at the same time, each in its own transaction on its own connection."
        actions={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="race-attempts">
              Concurrent transactions
            </label>
            <Select id="race-attempts" value={attempts} onChange={(e) => setAttempts(e.target.value)} className="h-8 w-[8.5rem] text-[13px]">
              {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
                <option key={n} value={n}>
                  {n} transactions
                </option>
              ))}
            </Select>
            <Button variant="primary" size="sm" icon={<Zap className="size-3.5" />} loading={race.isPending} onClick={() => race.mutate()}>
              Start the race
            </Button>
          </div>
        }
      >
        {race.data ? (
          <RaceChart data={race.data} />
        ) : (
          <Empty icon={<Database className="size-8" />} title="No race run yet." className="py-8">
            Start the race to send the bookings at once and see which one the database lets through.
          </Empty>
        )}
        <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm text-ink-2 md:grid-cols-3">
          <p>
            <span className="font-semibold text-ink">Lock.</span> <code className="font-mono text-[13px]">sp_book_appointment</code> runs{' '}
            <code className="font-mono text-[13px]">SELECT … FOR UPDATE</code> on the doctor row, so concurrent bookings for that doctor
            queue behind whoever got the lock first.
          </p>
          <p>
            <span className="font-semibold text-ink">Check, then insert.</span> When a waiting transaction gets the lock, the first booking
            has committed, so its 30-minute conflict check fails with SQLSTATE MT409 and it rolls back.
          </p>
          <p>
            <span className="font-semibold text-ink">Clean-up.</span> The winning appointment is deleted afterwards so the demo leaves no
            trace. Without the lock, the partial unique index <code className="font-mono text-[13px]">uq_appt_doctor_slot</code> would
            still reject exact duplicates.
          </p>
        </div>
      </Panel>

      <Panel
        title="Materialized view"
        description="mv_diagnosis_stats stores pre-aggregated diagnosis counts used by the admin dashboard. It goes stale until it is refreshed."
        actions={
          <Button size="sm" icon={<RefreshCw className="size-3.5" />} loading={refresh.isPending} onClick={() => refresh.mutate()}>
            Refresh materialized view
          </Button>
        }
      >
        {refresh.data ? (
          <p className="flex items-center gap-2 text-sm text-ink">
            <CircleCheck className="size-4 text-ok" />
            Refreshed {refresh.data.rows} rows in {refresh.data.ms} ms with{' '}
            <code className="font-mono text-[13px]">REFRESH MATERIALIZED VIEW CONCURRENTLY</code>, which keeps the old rows readable while
            the new ones are computed. It needs the unique index uq_mv_diagnosis_stats.
          </p>
        ) : (
          <p className="text-sm text-ink-3">Refresh after recording new visits to update the diagnosis statistics.</p>
        )}
      </Panel>
    </div>
  );
}

function RaceChart({ data }: { data: RaceResult }) {
  const max = Math.max(1, ...data.results.map((r) => r.finished_ms)) * 1.04;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max));
  return (
    <div>
      <p className="mb-4 text-[15px] text-ink">
        <span className="font-semibold">Dr. {data.doctor.full_name}</span>, {fmt.dateTime(data.slot)}:{' '}
        <span className={cx('font-semibold', data.committed === 1 ? 'text-ok' : 'text-danger')}>
          {data.committed} of {data.results.length} transactions committed
        </span>
        .
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[36rem] space-y-2">
          {data.results.map((r) => {
            const left = (r.started_ms / max) * 100;
            const width = Math.max(1.5, ((r.finished_ms - r.started_ms) / max) * 100);
            return (
              <div key={r.patient_id} className="grid grid-cols-[11rem_minmax(0,1fr)] items-start gap-3">
                <div className="flex items-center gap-1.5 pt-1 text-sm">
                  {r.ok ? <CircleCheck className="size-4 shrink-0 text-ok" /> : <CircleX className="size-4 shrink-0 text-danger" />}
                  <span className="truncate text-ink" title={r.patient_name}>
                    {r.patient_name}
                  </span>
                </div>
                <div>
                  <div className="relative h-7 rounded-md bg-muted">
                    <div
                      className={cx(
                        'absolute inset-y-1 flex items-center overflow-hidden rounded px-2 font-mono text-[11px] whitespace-nowrap',
                        r.ok ? 'bg-ok text-white dark:text-[#0d141b]' : 'border border-danger/40 bg-danger-soft text-danger',
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${r.started_ms} ms to ${r.finished_ms} ms`}
                    >
                      {r.finished_ms - r.started_ms} ms
                    </div>
                  </div>
                  <p className={cx('mt-0.5 text-xs', r.ok ? 'text-ok' : 'text-ink-3')}>
                    {r.ok ? `Committed appointment #${r.appointment_id} (deleted after the demo)` : `${r.error}${r.code ? ` (SQLSTATE ${r.code})` : ''}`}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-3">
            <span />
            <div className="relative h-5 border-t border-line text-[11px] text-ink-3">
              {ticks.map((t, i) => (
                <span
                  key={i}
                  className={cx(
                    'num absolute top-1 font-mono whitespace-nowrap',
                    i === 0 ? '' : i === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
                  )}
                  style={{ left: `${(t / max) * 100}%` }}
                >
                  {t} ms
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
