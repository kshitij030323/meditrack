import Anthropic from '@anthropic-ai/sdk';

/**
 * Generation backends for the RAG features. Retrieval never depends on these:
 * when no model is available the app falls back to an extractive summary of
 * the retrieved records.
 *
 *   LLM_PROVIDER=auto      -> Anthropic if ANTHROPIC_API_KEY is set, else Ollama if reachable, else none
 *   LLM_PROVIDER=anthropic -> Claude via the Anthropic API
 *   LLM_PROVIDER=ollama    -> local model via Ollama (default qwen2.5:7b)
 *   LLM_PROVIDER=none      -> extractive answers only
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmInfo {
  provider: 'anthropic' | 'ollama' | 'none';
  model: string | null;
  note?: string;
}

const OLLAMA_URL = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

let cached: { info: LlmInfo; at: number } | null = null;

async function ollamaHasModel(): Promise<{ ok: boolean; note?: string }> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return { ok: false, note: `Ollama answered ${res.status}.` };
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const found = names.some((n) => n === OLLAMA_MODEL || n === `${OLLAMA_MODEL}:latest`);
    return found ? { ok: true } : { ok: false, note: `Run \`ollama pull ${OLLAMA_MODEL}\` to enable AI answers.` };
  } catch {
    return { ok: false, note: `Ollama is not reachable at ${OLLAMA_URL}.` };
  }
}

/** Picks the provider once every 30 s so a newly started Ollama is noticed. */
export async function resolveLlm(): Promise<LlmInfo> {
  if (cached && Date.now() - cached.at < 30_000) return cached.info;
  const pref = (process.env.LLM_PROVIDER ?? 'auto').toLowerCase();
  let info: LlmInfo;
  if (pref === 'none') {
    info = { provider: 'none', model: null, note: 'AI generation is turned off (LLM_PROVIDER=none).' };
  } else if ((pref === 'auto' || pref === 'anthropic') && process.env.ANTHROPIC_API_KEY) {
    info = { provider: 'anthropic', model: ANTHROPIC_MODEL };
  } else if (pref === 'anthropic') {
    info = { provider: 'none', model: null, note: 'LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.' };
  } else {
    const ollama = await ollamaHasModel();
    info = ollama.ok ? { provider: 'ollama', model: OLLAMA_MODEL } : { provider: 'none', model: null, note: ollama.note };
  }
  cached = { info, at: Date.now() };
  return info;
}

async function* streamAnthropic(system: string, messages: ChatTurn[]): AsyncGenerator<string> {
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    system,
    messages,
    output_config: { effort: 'medium' },
    // If a safety classifier declines, the API re-runs the request on its recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    yield '\n\n_The model declined to answer this request._';
  } else if (final.stop_reason === 'max_tokens') {
    yield '\n\n_Answer truncated at the length limit._';
  }
}

async function* streamOllama(system: string, messages: ChatTurn[]): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
      options: { temperature: 0.2, num_ctx: 8192 },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama returned ${res.status}.`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean; error?: string };
      if (chunk.error) throw new Error(chunk.error);
      if (chunk.message?.content) yield chunk.message.content;
      if (chunk.done) return;
    }
  }
}

export function streamChat(info: LlmInfo, system: string, messages: ChatTurn[]): AsyncGenerator<string> {
  if (info.provider === 'anthropic') return streamAnthropic(system, messages);
  if (info.provider === 'ollama') return streamOllama(system, messages);
  throw new Error('No language model is configured.');
}
