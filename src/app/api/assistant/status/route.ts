import { queryOne } from '@/lib/db';
import { requireActor, route } from '@/lib/api';
import { EMBEDDING_DIM, EMBEDDING_MODEL } from '@/lib/embeddings';
import { resolveLlm } from '@/lib/llm';

export const GET = route(async () => {
  await requireActor('doctor', 'admin');
  const [llm, counts] = await Promise.all([
    resolveLlm(),
    queryOne(`
      SELECT (SELECT count(*) FROM visits WHERE note_embedding IS NOT NULL)      AS visits,
             (SELECT count(*) FROM conditions_kb WHERE kb_embedding IS NOT NULL) AS conditions,
             (SELECT count(*) FROM medications WHERE med_embedding IS NOT NULL)  AS medications`),
  ]);
  return { llm, embedding: { model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIM, metric: 'cosine' }, vectors: counts };
});
