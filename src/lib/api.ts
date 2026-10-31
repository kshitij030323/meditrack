import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions, type Role } from './auth';
import { queryOne } from './db';
import { ApiError, toErrorResponse } from './errors';

export interface Actor {
  id: number;
  role: Role;
  name: string;
  email: string;
}

/**
 * Resolves the signed-in user for an API call and enforces RBAC.
 * The account's is_active flag is re-checked on every request so a
 * deactivated user loses access immediately, not when their JWT expires.
 */
export async function requireActor(...roles: Role[]): Promise<Actor> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new ApiError(401, 'Sign in to continue.');
  const row = await queryOne<{ is_active: boolean }>('SELECT is_active FROM users WHERE user_id = $1', [
    session.user.id,
  ]);
  if (!row?.is_active) throw new ApiError(401, 'This account is no longer active.');
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    throw new ApiError(403, `This action needs the ${roles.join(' or ')} role.`);
  }
  return { id: session.user.id, role: session.user.role, name: session.user.name, email: session.user.email };
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response | unknown>;

/** Wraps a route handler: JSON-encodes plain results and maps errors to HTTP responses. */
export function route<C = unknown>(fn: Handler<C>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      const result = await fn(req, ctx);
      return result instanceof Response ? result : Response.json(result ?? { ok: true });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export type IdParams = { params: Promise<{ id: string }> };

export async function idParam(ctx: IdParams): Promise<number> {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, 'Invalid id.');
  return n;
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, 'Request body must be JSON.');
  }
}

/** Server-sent events stream for token-by-token AI responses. */
export function sse(run: (send: (event: string, data: unknown) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        await run(send);
      } catch (err) {
        console.error('[sse]', err);
        send('error', { message: err instanceof Error ? err.message : 'Generation failed.' });
      } finally {
        send('done', {});
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
