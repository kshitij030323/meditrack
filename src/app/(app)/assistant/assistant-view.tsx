'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUp, Database, RotateCcw, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Answer, ProviderNote, SourceList, type LlmInfo, type RagSource } from '@/components/answer';
import { Badge, Button, cx, PageHeader, Panel } from '@/components/ui';
import { api, streamPost } from '@/lib/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: RagSource[];
  llm?: LlmInfo | null;
  error?: string;
}

interface Status {
  llm: LlmInfo;
  embedding: { model: string; dimensions: number; metric: string };
  vectors: { visits: number; conditions: number; medications: number };
}

const STARTERS = [
  'What should I rule out in a 30-year-old with burning chest pain after meals?',
  'Which drugs in our formulary should not be combined with warfarin?',
  'How have we treated dengue with low platelets, and how did those patients do?',
  'First-line options for newly diagnosed type 2 diabetes that we stock?',
];

export function AssistantView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const status = useQuery({ queryKey: ['assistant-status'], queryFn: () => api<Status>('/api/assistant/status') });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    const history = [...messages, { role: 'user' as const, content: question }];
    const assistantIndex = history.length;
    setMessages([...history, { role: 'assistant', content: '' }]);
    setSelected(assistantIndex);
    setHighlight(null);
    setInput('');
    setStreaming(true);
    const controller = new AbortController();
    ctrl.current = controller;
    const patch = (fn: (m: Message) => Message) =>
      setMessages((all) => all.map((m, i) => (i === assistantIndex ? fn(m) : m)));
    try {
      await streamPost(
        '/api/assistant',
        { messages: history.filter((m) => m.content).map(({ role, content }) => ({ role, content })) },
        {
          signal: controller.signal,
          onEvent: (event, data) => {
            if (event === 'meta') patch((m) => ({ ...m, llm: (data as { llm: LlmInfo }).llm }));
            if (event === 'sources') patch((m) => ({ ...m, sources: data as RagSource[] }));
            if (event === 'delta') patch((m) => ({ ...m, content: m.content + (data as { text: string }).text }));
            if (event === 'error') patch((m) => ({ ...m, error: (data as { message: string }).message }));
          },
        },
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') patch((m) => ({ ...m, error: (err as Error).message }));
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  const active = selected != null ? messages[selected] : undefined;

  return (
    <>
      <PageHeader
        title="Ask MediTrack"
        description="Answers come only from this hospital’s knowledge base, de-identified past cases and formulary. Each claim cites the record it came from."
        actions={
          messages.length > 0 ? (
            <Button
              icon={<RotateCcw className="size-4" />}
              onClick={() => {
                ctrl.current?.abort();
                setMessages([]);
                setSelected(null);
              }}
            >
              New conversation
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex min-h-[60vh] flex-col rounded-xl border border-line bg-surface">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-xl py-6">
                <p className="text-lg font-bold">What would you like to know?</p>
                <p className="mt-1 text-sm text-ink-2">
                  Each question is embedded and matched against {status.data?.vectors.conditions ?? '…'} conditions,{' '}
                  {status.data?.vectors.visits ?? '…'} past visits and {status.data?.vectors.medications ?? '…'} medications before the
                  model writes an answer.
                </p>
                <ul className="mt-5 space-y-2">
                  {STARTERS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="w-full rounded-lg border border-line px-4 py-3 text-left text-[15px] text-ink-2 transition-colors hover:border-vector/40 hover:bg-vector-soft/40 hover:text-ink"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-core px-4 py-2.5 text-[15px] whitespace-pre-wrap text-white dark:text-[#0d141b]">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div
                    key={i}
                    className={cx(
                      'rounded-xl border px-4 py-3 transition-colors',
                      selected === i ? 'border-vector/40 bg-vector-soft/25' : 'border-transparent',
                    )}
                    onClick={() => setSelected(i)}
                  >
                    {m.content ? (
                      <Answer
                        text={m.content}
                        sources={m.sources ?? []}
                        streaming={streaming && i === messages.length - 1}
                        onCite={(k) => {
                          setSelected(i);
                          setHighlight(k);
                          setTimeout(() => document.getElementById(`source-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
                        }}
                      />
                    ) : (
                      <p className="text-sm text-ink-3">
                        {m.sources ? `Retrieved ${m.sources.length} records, writing…` : 'Searching the database…'}
                      </p>
                    )}
                    {m.error && <p className="mt-2 text-sm text-danger">{m.error}</p>}
                    {!streaming || i !== messages.length - 1 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <ProviderNote llm={m.llm ?? null} />
                        {m.sources && (
                          <button type="button" onClick={() => setSelected(i)} className="text-xs font-semibold text-vector hover:underline">
                            {m.sources.length} sources
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ),
              )
            )}
            <div ref={endRef} />
          </div>

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface px-3 py-2 focus-within:border-vector focus-within:ring-2 focus-within:ring-vector/20">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about a presentation, a past case pattern or a drug"
                aria-label="Question"
                className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none placeholder:text-ink-3"
              />
              {streaming ? (
                <Button size="sm" onClick={() => ctrl.current?.abort()} icon={<Square className="size-3.5" />}>
                  Stop
                </Button>
              ) : (
                <Button type="submit" size="sm" variant="vector" disabled={!input.trim()} icon={<ArrowUp className="size-4" />}>
                  Ask
                </Button>
              )}
            </div>
            <p className="mt-1.5 px-1 text-xs text-ink-3">Enter to send, Shift+Enter for a new line. Decision support only.</p>
          </form>
        </section>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel
            title="Sources for this answer"
            description="Retrieved by vector + keyword search before generation"
            bodyClassName="max-h-[60vh] overflow-y-auto"
          >
            <SourceList
              sources={active?.sources ?? []}
              highlight={highlight}
              empty="Ask a question to see which records were retrieved."
            />
          </Panel>
          <Panel title="Pipeline">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">Embeddings</dt>
                <dd className="text-right">
                  {status.data ? `${status.data.embedding.model.split('/').pop()}, ${status.data.embedding.dimensions}-d, ${status.data.embedding.metric}` : '…'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">Vector store</dt>
                <dd className="text-right">PostgreSQL + pgvector (HNSW)</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-3">Generator</dt>
                <dd className="text-right">
                  {status.data?.llm.provider === 'none' ? (
                    <Badge tone="warn">
                      <Database className="size-3" /> Retrieval only
                    </Badge>
                  ) : (
                    status.data?.llm.model ?? '…'
                  )}
                </dd>
              </div>
            </dl>
            {status.data?.llm.note && <p className="mt-3 text-xs text-ink-3">{status.data.llm.note}</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
