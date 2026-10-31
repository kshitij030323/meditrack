'use client';

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt } from '@/lib/client';
import { StatusBadge } from '../ui';
import type { LabRow } from './types';

type LabStatus = LabRow['status'];

interface Point {
  t: number;
  value: number;
  status: LabStatus;
}

export interface LabSeries {
  test: string;
  unit: string | null;
  refRange: string | null;
  points: (LabRow & { visit_id: number })[];
}

/** Groups every lab result in a record by test name, oldest first. */
export function groupLabs(visits: { visit_id: number; labs: LabRow[] }[]): LabSeries[] {
  const map = new Map<string, LabSeries>();
  for (const v of visits) {
    for (const l of v.labs) {
      const s = map.get(l.test_name) ?? { test: l.test_name, unit: l.unit, refRange: l.ref_range, points: [] };
      s.points.push({ ...l, visit_id: v.visit_id });
      map.set(l.test_name, s);
    }
  }
  for (const s of map.values()) {
    s.points.sort((a, b) => new Date(a.tested_at).getTime() - new Date(b.tested_at).getTime());
    const last = s.points[s.points.length - 1];
    s.unit = last.unit;
    s.refRange = last.ref_range;
  }
  return [...map.values()].sort((a, b) => b.points.length - a.points.length || a.test.localeCompare(b.test));
}

function parseRange(ref: string | null): { lo: number | null; hi: number | null } {
  if (!ref) return { lo: null, hi: null };
  const m = ref.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (m) return { lo: Number(m[1]), hi: Number(m[2]) };
  if (ref.startsWith('<')) return { lo: null, hi: Number(ref.slice(1)) };
  if (ref.startsWith('>')) return { lo: Number(ref.slice(1)), hi: null };
  return { lo: null, hi: null };
}

/**
 * Status is encoded by colour AND shape (warn and danger are too close for
 * deuteranopes): filled circle = normal, ring = abnormal, diamond = critical.
 */
function StatusMark({ cx, cy, status, size = 4 }: { cx: number; cy: number; status: LabStatus; size?: number }) {
  if (status === 'critical') {
    const r = size + 1.5;
    return (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
        fill="var(--danger)"
        stroke="var(--surface)"
        strokeWidth={2}
      />
    );
  }
  if (status === 'abnormal') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={size + 2} fill="var(--surface)" />
        <circle cx={cx} cy={cy} r={size} fill="var(--surface)" stroke="var(--warn)" strokeWidth={2.5} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={size} fill="var(--core)" stroke="var(--surface)" strokeWidth={2} />;
}

export function StatusLegend() {
  const item = (status: LabStatus, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <StatusMark cx={7} cy={7} status={status} />
      </svg>
      {label}
    </span>
  );
  return (
    <p className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
      {item('normal', 'Normal')}
      {item('abnormal', 'Abnormal')}
      {item('critical', 'Critical')}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded-sm bg-ok-soft ring-1 ring-ok/30" aria-hidden />
        Reference range
      </span>
    </p>
  );
}

function trimNum(n: number) {
  return Number(n.toFixed(3)).toString();
}

export function LabTrendChart({ series }: { series: LabSeries }) {
  const data: Point[] = series.points.map((p) => ({ t: new Date(p.tested_at).getTime(), value: p.result_value, status: p.status }));
  const { lo, hi } = parseRange(series.refRange);
  const values = data.map((d) => d.value);
  const top = Math.max(...values, hi ?? 0) * 1.12;
  const bottom = Math.min(0, ...values);
  const latest = series.points[series.points.length - 1];

  return (
    <figure className="rounded-xl border border-line bg-surface p-4">
      <figcaption className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{series.test}</p>
          <p className="text-xs text-ink-3">
            {series.points.length} results{series.refRange ? `, reference ${series.refRange}${series.unit ? ` ${series.unit}` : ''}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="num text-[17px] leading-tight font-bold text-ink">
            {trimNum(latest.result_value)}
            <span className="ml-1 text-xs font-normal text-ink-3">{series.unit}</span>
          </p>
          <StatusBadge status={latest.status} />
        </div>
      </figcaption>
      <div className="mt-3 h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="0" />
            {(lo != null || hi != null) && (
              <ReferenceArea
                y1={lo ?? bottom}
                y2={hi ?? top}
                fill="var(--ok-soft)"
                fillOpacity={0.8}
                stroke="none"
                ifOverflow="extendDomain"
              />
            )}
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              padding={{ left: 14, right: 14 }}
              tickFormatter={(t: number) => fmt.dateShort(new Date(t))}
              tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--line-strong)' }}
              minTickGap={24}
            />
            <YAxis
              width={42}
              domain={[bottom, top]}
              tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => trimNum(v)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                const p = active && payload?.[0] ? (payload[0].payload as Point) : null;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-pop">
                    <p className="num text-sm font-bold text-ink">
                      {trimNum(p.value)} <span className="font-normal text-ink-3">{series.unit}</span>
                    </p>
                    <p className="text-xs text-ink-2">
                      {fmt.date(new Date(p.t))}, {p.status}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--core)"
              strokeWidth={2}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: Point; index?: number }) => (
                <g key={`dot-${props.index}`}>
                  {props.cx != null && props.cy != null && props.payload ? (
                    <StatusMark cx={props.cx} cy={props.cy} status={props.payload.status} />
                  ) : null}
                </g>
              )}
              activeDot={(props: { cx?: number; cy?: number; payload?: Point }) => (
                <g>
                  {props.cx != null && props.cy != null && props.payload ? (
                    <StatusMark cx={props.cx} cy={props.cy} status={props.payload.status} size={6} />
                  ) : null}
                </g>
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">Show values</summary>
        <table className="mt-2 w-full">
          <tbody>
            {[...series.points].reverse().map((p) => (
              <tr key={p.lab_result_id} className="border-t border-line">
                <td className="py-1.5 text-ink-2">{fmt.date(p.tested_at)}</td>
                <td className="num py-1.5 text-right font-semibold">
                  {trimNum(p.result_value)} {p.unit}
                </td>
                <td className="py-1.5 pl-3 text-right">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
