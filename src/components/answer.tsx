'use client';

import { Cpu, Database } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamPost } from '@/lib/client';
import { cx, SimilarityBar } from './ui';

export interface RagSource {
  key: string;
  kind: 'condition' | 'case' | 'medication' | 'visit';
  id: number;
  title: string;
  subtitle: string;
  similarity: number | null;
  snippet: string;
}

export interface LlmInfo {
  provider: 'anthropic' | 'ollama' | 'none';
  model: string | null;
  note?: string;
}

const kindStyle: Record<RagSource['kind'], string> = {
  condition: 'bg-ref-soft text-ref border-ref/25',
  medication: 'bg-ref-soft text-ref border-ref/25',
  case: 'bg-vector-soft text-vector border-vector/25',
  visit: 'bg-core-soft text-core border-core/25',
};
const kindLabel: Record<RagSource['kind'], string> = {
  condition: 'Knowledge base',
  medication: 'Formulary',
  case: 'Past case',
  visit: 'Visit',
};

export function sourceHref(s: RagSource): string | null {
  if (s.kind === 'condition') return `/search?q=${encodeURIComponent(s.title)}&open=${s.id}`;
  if (s.kind === 'medication') return `/medications?open=${s.id}`;
  return null;
}

/** Markdown answer in which [K1] / [C2] / [M3] / [V4] citations become chips. */
export function Answer({
  text,
  sources,
  streaming,
  onCite,
  className,
}: {
  text: string;
  sources: RagSource[];
  streaming?: boolean;
  onCite?: (key: string) => void;
  className?: string;
}) {
  const byKey = new Map(sources.map((s) => [s.key, s]));
  // Accept both [C1][C3] and grouped [C1, C3] citations.
  const linked = text.replace(/\[((?:[KCMV]\d{1,2})(?:\s*[,;]\s*[KCMV]\d{1,2})*)\]/g, (_, keys: string) =>
    keys
      .split(/\s*[,;]\s*/)
      .map((k) => `[${k}](#cite-${k})`)
      .join(''),
  );
  return (
    <div className={cx('prose-answer text-[15px] text-ink', streaming && 'caret', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#cite-')) {
              const key = href.slice(6);
              const src = byKey.get(key);
              return (
                <button
                  type="button"
                  onClick={() => onCite?.(key)}
                  title={src ? `${src.title}: ${src.subtitle}` : key}
                  className={cx(
                    'mx-0.5 inline-flex -translate-y-px items-center rounded border px-1 font-mono text-[11px] leading-[1.35] font-semibold align-baseline',
                    src ? kindStyle[src.kind] : 'border-line bg-muted text-ink-3',
                  )}
                >
                  {key}
                </button>
              );
            }
            return (
              <a href={href} className="text-core underline underline-offset-2" target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {linked}
      </ReactMarkdown>
    </div>
  );
}

export function SourceList({
  sources,
  highlight,
  empty = 'No records were retrieved.',
}: {
  sources: RagSource[];
  highlight?: string | null;
  empty?: ReactNode;
}) {
  if (!sources.length) return <p className="text-sm text-ink-3">{empty}</p>;
  return (
    <ol className="space-y-2">
      {sources.map((s) => {
        const href = sourceHref(s);
        const body = (
          <>
            <div className="flex items-center gap-2">
              <span className={cx('rounded border px-1 font-mono text-[11px] font-semibold', kindStyle[s.kind])}>{s.key}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{s.title}</span>
              {s.similarity != null && <SimilarityBar value={s.similarity} />}
            </div>
            <p className="mt-0.5 text-xs text-ink-3">
              {kindLabel[s.kind]}
              {s.subtitle && s.subtitle !== kindLabel[s.kind] ? `, ${s.subtitle}` : ''}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-2">{s.snippet}</p>
          </>
        );
        return (
          <li
            key={s.key}
            id={`source-${s.key}`}
            className={cx(
              'rounded-lg border px-3 py-2.5 transition-colors',
              highlight === s.key ? 'border-vector bg-vector-soft/60' : 'border-line bg-surface',
            )}
          >
            {href ? (
              <Link href={href} className="block hover:opacity-90">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ProviderNote({ llm }: { llm: LlmInfo | null }) {
  if (!llm) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      {llm.provider === 'none' ? <Database className="size-3.5" /> : <Cpu className="size-3.5" />}
      {llm.provider === 'none'
        ? 'Retrieval only, no language model connected'
        : `Generated by ${llm.model} (${llm.provider === 'ollama' ? 'local, Ollama' : 'Anthropic API'})`}
    </span>
  );
}

export interface StreamState {
  text: string;
  sources: RagSource[];
  llm: LlmInfo | null;
  streaming: boolean;
  error: string | null;
}

const initial: StreamState = { text: '', sources: [], llm: null, streaming: false, error: null };

/** Runs one SSE generation request (sources first, then text deltas). */
export function useRagStream(path: string) {
  const [state, setState] = useState<StreamState>(initial);
  const ctrl = useRef<AbortController | null>(null);

  const start = useCallback(
    async (body: unknown) => {
      ctrl.current?.abort();
      const controller = new AbortController();
      ctrl.current = controller;
      setState({ ...initial, streaming: true });
      try {
        await streamPost(path, body, {
          signal: controller.signal,
          onEvent: (event, data) => {
            setState((s) => {
              switch (event) {
                case 'meta':
                  return { ...s, llm: (data as { llm: LlmInfo }).llm };
                case 'sources':
                  return { ...s, sources: data as RagSource[] };
                case 'delta':
                  return { ...s, text: s.text + (data as { text: string }).text };
                case 'error':
                  return { ...s, error: (data as { message: string }).message };
                case 'done':
                  return { ...s, streaming: false };
                default:
                  return s;
              }
            });
          },
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((s) => ({ ...s, error: (err as Error).message }));
        }
      } finally {
        setState((s) => ({ ...s, streaming: false }));
      }
    },
    [path],
  );

  const stop = useCallback(() => {
    ctrl.current?.abort();
    setState((s) => ({ ...s, streaming: false }));
  }, []);

  const reset = useCallback(() => {
    ctrl.current?.abort();
    setState(initial);
  }, []);

  return { ...state, start, stop, reset };
}
