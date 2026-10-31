'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Columns3, Pill, Search, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Badge,
  cx,
  Drawer,
  Empty,
  PageHeader,
  Panel,
  Segmented,
  SimilarityBar,
  Skeleton,
  StatusBadge,
} from '@/components/ui';
import { api } from '@/lib/client';

type Kind = 'conditions' | 'medications';
type Mode = 'hybrid' | 'semantic' | 'keyword';

interface Hit {
  condition_id?: number;
  medication_id?: number;
  name: string;
  description: string | null;
  red_flags?: string | null;
  drug_class?: string | null;
  form?: string;
  strength?: string | null;
  stock_qty?: number;
  interactions?: string | null;
  similarity: number | null;
  keyword_rank: number | null;
  semantic_rank?: number | null;
  score: number;
}

interface SearchResponse {
  results: Hit[];
  timings: { embed_ms: number; sql_ms: number };
}

const EXAMPLES: Record<Kind, string[]> = {
  conditions: [
    'chest pain after meals',
    'fever with joint pain and rash',
    'wheezing and cough at night',
    'sudden weakness on one side of the body',
    'can’t sleep, feeling low, lost interest in things',
  ],
  medications: ['blood thinner', 'medicine for acid reflux', 'antibiotic for chest infection', 'high blood sugar', 'trouble sleeping'],
};

const MODE_LABEL: Record<Mode, string> = { hybrid: 'Hybrid', semantic: 'Semantic', keyword: 'Keyword' };

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function useSearch(q: string, kind: Kind, mode: Mode, enabled = true) {
  return useQuery({
    queryKey: ['search', kind, mode, q],
    queryFn: () =>
      api<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}&kind=${kind}&mode=${mode}&k=10`),
    enabled: enabled && q.trim().length >= 2,
    placeholderData: (prev) => prev,
  });
}

export function SearchView({
  initialQuery,
  initialKind,
  initialMode,
  initialOpen,
}: {
  initialQuery: string;
  initialKind: Kind;
  initialMode: Mode;
  initialOpen: number | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [compare, setCompare] = useState(false);
  const [openId, setOpenId] = useState<number | null>(initialOpen);
  const query = useDebounced(q.trim(), 350);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (kind !== 'conditions') params.set('kind', kind);
    if (mode !== 'hybrid') params.set('mode', mode);
    router.replace(`/search${params.size ? `?${params}` : ''}`, { scroll: false });
  }, [query, kind, mode, router]);

  const single = useSearch(query, kind, mode, !compare);

  return (
    <>
      <PageHeader
        title="Medical search"
        description="Ask the condition and drug catalogues in plain language. Results are ranked by meaning, not just matching words."
      />

      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={kind === 'conditions' ? 'Describe symptoms, e.g. chest pain after meals' : 'Describe what the drug is for, e.g. blood thinner'}
            aria-label="Search query"
            className="h-12 w-full rounded-lg border border-line-strong bg-surface pr-4 pl-11 text-[17px] placeholder:text-ink-3 focus:border-vector focus:ring-2 focus:ring-vector/20 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Segmented
            label="Catalogue"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setOpenId(null);
            }}
            options={[
              { value: 'conditions', label: <span className="inline-flex items-center gap-1.5"><Stethoscope className="size-3.5" />Conditions</span> },
              { value: 'medications', label: <span className="inline-flex items-center gap-1.5"><Pill className="size-3.5" />Medications</span> },
            ]}
          />
          {!compare && (
            <Segmented
              label="Ranking"
              value={mode}
              onChange={setMode}
              options={(['hybrid', 'semantic', 'keyword'] as Mode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))}
            />
          )}
          <button
            type="button"
            onClick={() => setCompare((c) => !c)}
            aria-pressed={compare}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors',
              compare ? 'border-vector/40 bg-vector-soft text-vector' : 'border-line text-ink-2 hover:text-ink',
            )}
          >
            <Columns3 className="size-4" />
            Compare all three
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES[kind].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQ(ex)}
              className="rounded-full border border-line bg-muted px-3 py-1 text-[13px] text-ink-2 hover:border-vector/40 hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6">
        {query.length < 2 ? (
          <Empty icon={<Search className="size-7" />} title="Start typing to search" className="rounded-xl border border-dashed border-line-strong">
            Try a symptom in everyday words. Switch to Compare to see where keyword search misses what semantic search finds.
          </Empty>
        ) : compare ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {(['keyword', 'semantic', 'hybrid'] as Mode[]).map((m) => (
              <CompareColumn key={m} q={query} kind={kind} mode={m} onOpen={setOpenId} />
            ))}
          </div>
        ) : (
          <Panel
            title={single.data ? `${single.data.results.length} results` : 'Searching…'}
            description={
              single.data
                ? `${MODE_LABEL[mode]} ranking. Query embedded in ${single.data.timings.embed_ms} ms, SQL ran in ${single.data.timings.sql_ms} ms.`
                : undefined
            }
            bodyClassName="p-0"
          >
            {single.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : single.data?.results.length ? (
              <ol className="divide-y divide-line">
                {single.data.results.map((h, i) => (
                  <ResultRow key={h.condition_id ?? h.medication_id} hit={h} rank={i + 1} kind={kind} onOpen={setOpenId} />
                ))}
              </ol>
            ) : (
              <Empty title="No matches">
                {mode === 'keyword'
                  ? 'None of these words appear in the catalogue. Switch to Semantic or Hybrid to match by meaning.'
                  : 'Try describing it differently.'}
              </Empty>
            )}
          </Panel>
        )}
      </div>

      <HowItWorks />

      <ConditionDrawer id={kind === 'conditions' ? openId : null} onClose={() => setOpenId(null)} />
    </>
  );
}

function ResultRow({ hit, rank, kind, onOpen }: { hit: Hit; rank: number; kind: Kind; onOpen: (id: number) => void }) {
  const isCondition = kind === 'conditions';
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="num w-5 font-mono text-xs text-ink-3">{rank}</span>
        <span className="font-semibold text-ink">
          {hit.name}
          {!isCondition && hit.strength ? <span className="font-normal text-ink-3"> {hit.strength}</span> : null}
        </span>
        {!isCondition && hit.drug_class && <Badge tone="ref">{hit.drug_class}</Badge>}
        <span className="ml-auto flex items-center gap-3">
          {hit.keyword_rank != null && <Badge>Keyword #{hit.keyword_rank}</Badge>}
          <SimilarityBar value={hit.similarity} />
        </span>
      </div>
      <p className="mt-1 line-clamp-2 pl-8 text-[14px] leading-snug text-ink-2">{hit.description}</p>
      {isCondition && hit.red_flags && (
        <p className="mt-1 flex gap-1.5 pl-8 text-[13px] text-ink-3">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="Red flags" />
          <span className="line-clamp-1">{hit.red_flags}</span>
        </p>
      )}
      {!isCondition && (
        <p className="mt-1 pl-8 text-xs text-ink-3">
          {hit.form}, {hit.stock_qty} in stock
          {hit.interactions ? `, ${hit.interactions.split(' | ').length} known interactions` : ''}
        </p>
      )}
    </>
  );
  return (
    <li>
      {isCondition ? (
        <button type="button" onClick={() => onOpen(hit.condition_id!)} className="block w-full px-5 py-3.5 text-left hover:bg-muted">
          {content}
        </button>
      ) : (
        <Link href={`/medications?open=${hit.medication_id}`} className="block px-5 py-3.5 hover:bg-muted">
          {content}
        </Link>
      )}
    </li>
  );
}

function CompareColumn({ q, kind, mode, onOpen }: { q: string; kind: Kind; mode: Mode; onOpen: (id: number) => void }) {
  const { data, isLoading } = useSearch(q, kind, mode);
  const explain: Record<Mode, string> = {
    keyword: 'PostgreSQL full-text search (tsvector, ts_rank_cd). Needs the words to appear.',
    semantic: 'Cosine similarity of 384-dim embeddings (pgvector). Matches meaning.',
    hybrid: 'Both rankings fused with Reciprocal Rank Fusion.',
  };
  return (
    <Panel title={MODE_LABEL[mode]} description={explain[mode]} bodyClassName="p-0">
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : data?.results.length ? (
        <ol className="divide-y divide-line">
          {data.results.slice(0, 8).map((h, i) => {
            const id = h.condition_id ?? h.medication_id!;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => (kind === 'conditions' ? onOpen(id) : window.location.assign(`/medications?open=${id}`))}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <span className="num w-4 font-mono text-xs text-ink-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{h.name}</span>
                  {mode === 'keyword' ? (
                    <span className="num font-mono text-xs text-ink-3">{(h.score * 1000).toFixed(1)}</span>
                  ) : (
                    <SimilarityBar value={h.similarity} />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <Empty title="No matches" className="py-8">
          {mode === 'keyword' ? 'No catalogue entry contains these words.' : 'Nothing similar enough.'}
        </Empty>
      )}
    </Panel>
  );
}

interface ConditionDetail {
  condition_id: number;
  name: string;
  description: string;
  red_flags: string | null;
  cases: { visit_id: number; diagnosis: string | null; outcome: string | null; patient_age: number; patient_gender: string; department: string; symptom_note: string; similarity: number }[];
  medications: { medication_id: number; name: string; strength: string | null; times: number }[];
  neighbours: { condition_id: number; name: string; similarity: number }[];
}

function ConditionDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['condition', id],
    queryFn: () => api<ConditionDetail>(`/api/conditions/${id}`),
    enabled: id != null,
  });
  return (
    <Drawer open={id != null} onClose={onClose} title={data?.name ?? 'Condition'} subtitle="Knowledge base entry">
      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          <p className="leading-relaxed text-ink">{data.description}</p>
          {data.red_flags && (
            <div className="rounded-lg border border-danger/25 bg-danger-soft px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-danger">
                <AlertTriangle className="size-4" /> Red flags
              </p>
              <p className="mt-1 text-sm text-ink">{data.red_flags}</p>
            </div>
          )}
          <section>
            <h3 className="text-sm font-bold">Recorded cases closest to this description</h3>
            <p className="text-xs text-ink-3">Vector join between conditions_kb.kb_embedding and visits.note_embedding</p>
            <ul className="mt-2 space-y-2">
              {data.cases.map((c) => (
                <li key={c.visit_id} className="rounded-lg border border-line px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.diagnosis}</span>
                    <StatusBadge status={c.outcome} />
                    <SimilarityBar value={c.similarity} />
                  </div>
                  <p className="text-xs text-ink-3">
                    {c.patient_age} y {c.patient_gender}, {c.department}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{c.symptom_note}</p>
                </li>
              ))}
            </ul>
          </section>
          {data.medications.length > 0 && (
            <section>
              <h3 className="text-sm font-bold">Most prescribed for this diagnosis</h3>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                {data.medications.map((m) => (
                  <li key={m.medication_id}>
                    <Link href={`/medications?open=${m.medication_id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                      <Pill className="size-4 text-ref" />
                      <span className="flex-1 font-semibold">
                        {m.name} <span className="font-normal text-ink-3">{m.strength}</span>
                      </span>
                      <span className="num text-ink-2">{m.times}×</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3 className="text-sm font-bold">Often confused with</h3>
            <p className="text-xs text-ink-3">Nearest neighbours in embedding space</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.neighbours.map((n) => (
                <li key={n.condition_id}>
                  <Link
                    href={`/search?q=${encodeURIComponent(n.name)}&open=${n.condition_id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[13px] hover:border-vector/40"
                  >
                    {n.name}
                    <span className="num font-mono text-xs text-vector">{n.similarity.toFixed(2)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs text-ink-3">Knowledge-base content supports clinical decisions in this project; it is not medical advice.</p>
        </div>
      )}
    </Drawer>
  );
}

function HowItWorks() {
  const rows = [
    ['What is embedded', 'Condition name + description (conditions_kb.kb_embedding), drug name, class and indications (medications.med_embedding), and every visit’s symptom note (visits.note_embedding).'],
    ['Embedding model', 'all-MiniLM-L6-v2 sentence transformer, run locally through ONNX. 384 dimensions, mean-pooled and L2-normalised.'],
    ['How vectors are stored', 'pgvector VECTOR(384) columns in the same PostgreSQL tables as the records they describe, each with an HNSW index (vector_cosine_ops).'],
    ['Similarity metric', 'Cosine distance with the <=> operator. Similarity shown is 1 − distance.'],
    ['Retrieval', 'fn_search_conditions / fn_search_medications take the top 40 by vector distance and the top 40 by ts_rank_cd, then merge them with Reciprocal Rank Fusion, score = Σ 1 / (60 + rank).'],
  ];
  return (
    <details className="group mt-8 rounded-xl border border-line bg-surface">
      <summary className="cursor-pointer list-none px-5 py-4 font-bold">How this search works</summary>
      <dl className="grid gap-x-6 gap-y-3 border-t border-line px-5 py-4 text-sm md:grid-cols-[12rem_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-ink-2">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
