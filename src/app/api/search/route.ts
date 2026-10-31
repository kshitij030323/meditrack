import { z } from 'zod';
import { requireActor, route } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { searchConditions, searchMedications } from '@/lib/rag';

const SearchQuery = z.object({
  q: z.string().trim().min(2, 'Type at least 2 characters.').max(500),
  kind: z.enum(['conditions', 'medications']).default('conditions'),
  mode: z.enum(['hybrid', 'semantic', 'keyword']).default('hybrid'),
  k: z.coerce.number().int().min(1).max(30).default(10),
});

/** Natural-language catalog search; returns timings so the UI can show where time goes. */
export const GET = route(async (req) => {
  await requireActor('doctor', 'admin');
  const p = SearchQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
  const t0 = performance.now();
  const embedding = p.mode === 'keyword' ? null : await embed(p.q);
  const t1 = performance.now();
  const results = p.kind === 'conditions'
    ? await searchConditions(embedding, p.q, p.mode, p.k)
    : await searchMedications(embedding, p.q, p.mode, p.k);
  const t2 = performance.now();
  return {
    query: p.q, kind: p.kind, mode: p.mode, results,
    timings: { embed_ms: Math.round(t1 - t0), sql_ms: Math.round(t2 - t1) },
  };
});
