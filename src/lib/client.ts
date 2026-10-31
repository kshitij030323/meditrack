'use client';

import { toast } from 'sonner';

/** Error thrown by `api()`; carries the database rule that rejected the request, if any. */
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
    public hint?: string,
    public db?: { code: string; constraint?: string; kind: string },
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new RequestError(data?.error ?? `Request failed (${res.status})`, res.status, data?.detail, data?.hint, data?.db);
  }
  return data as T;
}

/** Shows an error toast; when a database rule fired, names it (e.g. "CHECK chk_pat_phone"). */
export function toastError(err: unknown) {
  if (err instanceof RequestError) {
    const rule = err.db
      ? `Rejected by ${err.db.kind}${err.db.constraint ? ` ${err.db.constraint}` : ''} (SQLSTATE ${err.db.code})`
      : undefined;
    toast.error(err.message, { description: [err.detail, err.hint, rule].filter(Boolean).join('\n') || undefined });
  } else {
    toast.error(err instanceof Error ? err.message : 'Something went wrong.');
  }
}

export interface StreamHandlers {
  onEvent: (event: string, data: unknown) => void;
  signal?: AbortSignal;
}

/** POSTs JSON and consumes a text/event-stream response. */
export async function streamPost(path: string, body: unknown, { onEvent, signal }: StreamHandlers) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new RequestError(data?.error ?? `Request failed (${res.status})`, res.status, data?.detail);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      onEvent(event, data ? JSON.parse(data) : null);
    }
  }
}

// ---------------------------------------------------------------------------
// Formatting (clinic time is Asia/Kolkata)
// ---------------------------------------------------------------------------
const TZ = 'Asia/Kolkata';

export const fmt = {
  date: (v: string | Date | null | undefined) =>
    v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '—',
  dateShort: (v: string | Date) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }),
  time: (v: string | Date) =>
    new Date(v).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }),
  dateTime: (v: string | Date) =>
    new Date(v).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
    }),
  weekday: (v: string | Date) => new Date(v).toLocaleDateString('en-IN', { weekday: 'short', timeZone: TZ }),
  money: (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
  pct: (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 100)}%`),
  /** 'YYYY-MM-DD' for the clinic-local day `offset` days from today. */
  isoDay: (offset = 0) => {
    const d = new Date(Date.now() + offset * 86_400_000);
    return d.toLocaleDateString('en-CA', { timeZone: TZ });
  },
  relative: (v: string | Date) => {
    const diff = (new Date(v).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86_400 * 30) return rtf.format(Math.round(diff / 86_400), 'day');
    if (abs < 86_400 * 365) return rtf.format(Math.round(diff / (86_400 * 30)), 'month');
    return rtf.format(Math.round(diff / (86_400 * 365)), 'year');
  },
};

export const FREQUENCIES = [
  { code: 'OD', label: 'Once daily' },
  { code: 'BD', label: 'Twice daily' },
  { code: 'TDS', label: 'Three times daily' },
  { code: 'QID', label: 'Four times daily' },
  { code: 'HS', label: 'At bedtime' },
  { code: 'SOS', label: 'When required' },
  { code: 'STAT', label: 'Single dose now' },
] as const;
