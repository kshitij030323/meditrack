import { z } from 'zod';
import { readJson, requireActor, route, sse } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { resolveLlm, streamChat } from '@/lib/llm';
import {
  TRIAGE_SYSTEM, caseContext, caseSources, conditionContext, conditionSources, extractiveTriage,
  searchConditions, similarCases,
} from '@/lib/rag';

const AssessInput = z.object({
  note: z.string().trim().min(10).max(4000),
  age: z.coerce.number().int().min(0).max(120).nullish(),
  gender: z.enum(['male', 'female', 'other']).nullish(),
});

/** RAG triage: retrieve KB conditions + similar cases, then stream a cited assessment. */
export const POST = route(async (req) => {
  await requireActor('doctor');
  const body = AssessInput.parse(await readJson(req));
  const embedding = await embed(body.note);
  const [conds, cases, llm] = await Promise.all([
    searchConditions(embedding, body.note, 'hybrid', 6),
    similarCases(embedding, 6),
    resolveLlm(),
  ]);
  const relevantCases = cases.filter((c) => c.similarity >= 0.3);

  return sse(async (send) => {
    send('meta', { llm });
    send('sources', [...conditionSources(conds), ...caseSources(relevantCases)]);
    if (llm.provider === 'none') {
      send('delta', { text: extractiveTriage(conds, relevantCases) });
      return;
    }
    const patient = [body.age != null ? `${body.age}-year-old` : null, body.gender ?? null].filter(Boolean).join(' ');
    const context = [conditionContext(conds), caseContext(relevantCases)].filter(Boolean).join('\n\n');
    const prompt = `<context>\n${context}\n</context>\n\nNew patient${patient ? ` (${patient})` : ''}. Symptom note:\n"""${body.note}"""`;
    for await (const text of streamChat(llm, TRIAGE_SYSTEM, [{ role: 'user', content: prompt }])) {
      send('delta', { text });
    }
  });
});
