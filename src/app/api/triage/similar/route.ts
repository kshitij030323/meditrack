import { z } from 'zod';
import { readJson, requireActor, route } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { searchConditions, similarCases } from '@/lib/rag';

const TriageInput = z.object({
  note: z.string().trim().min(10, 'Describe the symptoms in at least 10 characters.').max(4000),
  k: z.coerce.number().int().min(3).max(25).default(12),
});

/**
 * Semantic case retrieval: embeds the free-text note and returns the k nearest
 * historical visits (cosine similarity over HNSW) plus matching KB conditions.
 */
export const POST = route(async (req) => {
  await requireActor('doctor');
  const { note, k } = TriageInput.parse(await readJson(req));
  const t0 = performance.now();
  const embedding = await embed(note);
  const t1 = performance.now();
  const [cases, conditions] = await Promise.all([
    similarCases(embedding, k),
    searchConditions(embedding, note, 'semantic', 6),
  ]);
  const t2 = performance.now();

  const tally = new Map<string, { diagnosis: string; count: number; best: number }>();
  for (const c of cases) {
    const dx = c.diagnosis ?? 'Undiagnosed';
    const entry = tally.get(dx) ?? { diagnosis: dx, count: 0, best: 0 };
    entry.count += 1;
    entry.best = Math.max(entry.best, c.similarity);
    tally.set(dx, entry);
  }
  return {
    cases,
    conditions,
    distribution: [...tally.values()].sort((a, b) => b.count - a.count || b.best - a.best),
    timings: { embed_ms: Math.round(t1 - t0), sql_ms: Math.round(t2 - t1) },
  };
});
