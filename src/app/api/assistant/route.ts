import { z } from 'zod';
import { readJson, requireActor, route, sse } from '@/lib/api';
import { embed } from '@/lib/embeddings';
import { resolveLlm, streamChat, type ChatTurn } from '@/lib/llm';
import {
  ASSISTANT_SYSTEM, caseContext, caseSources, conditionContext, conditionSources, extractiveAnswer,
  medicationContext, medicationSources, searchConditions, searchMedications, similarCases,
} from '@/lib/rag';

const ChatInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(8000) }))
    .min(1)
    .max(20),
});

/**
 * Retrieval-augmented chat. The latest question is embedded once and used to
 * retrieve from three stores in parallel (KB conditions, past cases, formulary);
 * the retrieved records are injected into the final user turn as <context>.
 */
export const POST = route(async (req) => {
  await requireActor('doctor');
  const { messages } = ChatInput.parse(await readJson(req));
  const last = messages[messages.length - 1];
  const previousQuestion = [...messages].reverse().find((m, i) => i > 0 && m.role === 'user')?.content ?? '';
  // Follow-ups like "what about in children?" retrieve better with the previous question attached.
  const retrievalText = last.content.length < 60 && previousQuestion ? `${previousQuestion} ${last.content}` : last.content;

  const embedding = await embed(retrievalText);
  const [condsAll, casesAll, medsAll, llm] = await Promise.all([
    searchConditions(embedding, retrievalText, 'hybrid', 5),
    similarCases(embedding, 5),
    searchMedications(embedding, retrievalText, 'hybrid', 4),
    resolveLlm(),
  ]);
  // Keep strong semantic matches, or keyword matches that are at least loosely related in meaning.
  const conds = condsAll.filter((c) => (c.similarity ?? 0) >= 0.3 || (c.keyword_rank !== null && (c.similarity ?? 0) >= 0.2));
  const cases = casesAll.filter((c) => c.similarity >= 0.35);
  const meds = medsAll.filter((m) => (m.similarity ?? 0) >= 0.3 || m.keyword_rank !== null);

  return sse(async (send) => {
    send('meta', { llm });
    send('sources', [...conditionSources(conds), ...caseSources(cases), ...medicationSources(meds)]);
    if (llm.provider === 'none') {
      send('delta', { text: extractiveAnswer(conds, cases, meds) });
      return;
    }
    const context = [conditionContext(conds), caseContext(cases), medicationContext(meds)].filter(Boolean).join('\n\n');
    const turns: ChatTurn[] = [
      ...messages.slice(0, -1),
      { role: 'user', content: `<context>\n${context || 'No matching records were found.'}\n</context>\n\n${last.content}` },
    ];
    for await (const text of streamChat(llm, ASSISTANT_SYSTEM, turns)) send('delta', { text });
  });
});
