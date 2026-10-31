import path from 'node:path';
import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

/**
 * Local sentence embeddings with all-MiniLM-L6-v2 (384 dimensions, matching
 * the VECTOR(384) columns). Mean-pooled and L2-normalised, so cosine distance
 * in pgvector equals 1 - dot product. Runs on CPU via ONNX; the model (~90 MB)
 * downloads once into .cache/models.
 */
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIM = 384;

env.cacheDir = path.join(process.cwd(), '.cache', 'models');

type Loader = (task: 'feature-extraction', model: string, opts: object) => Promise<FeatureExtractionPipeline>;
const cache = globalThis as unknown as { __meditrackEmbedder?: Promise<FeatureExtractionPipeline> };

function getExtractor(): Promise<FeatureExtractionPipeline> {
  cache.__meditrackEmbedder ??= (pipeline as unknown as Loader)('feature-extraction', EMBEDDING_MODEL, {
    dtype: 'fp32',
  }).catch((err) => {
    cache.__meditrackEmbedder = undefined;
    throw err;
  });
  return cache.__meditrackEmbedder;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const output = await extractor(
    texts.map((t) => t.replace(/\s+/g, ' ').trim()),
    { pooling: 'mean', normalize: true },
  );
  const vectors = output.tolist() as number[][];
  if (vectors[0]?.length !== EMBEDDING_DIM) {
    throw new Error(`Embedding model returned ${vectors[0]?.length} dims, expected ${EMBEDDING_DIM}.`);
  }
  return vectors;
}

export async function embed(text: string): Promise<number[]> {
  const [vector] = await embedMany([text]);
  return vector;
}
