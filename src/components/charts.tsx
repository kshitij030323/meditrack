'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './ui';

/*
 * Small hand-built SVG charts following the dataviz mark specs: bars <= 24px
 * with a 4px rounded data-end and a square baseline, 2px surface gaps between
 * stacked segments, hairline solid grid, text in ink tokens (never series
 * colour), legend for >= 2 series, a hover/focus tooltip and a table fallback.
 */

export interface ChartSeries {
  key: string;
  label: string;
  color: string; // CSS colour, usually var(--chart-*)
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rect with only the top corners rounded (column data-end), square at the baseline. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export function Legend({ series, className }: { series: ChartSeries[]; className?: string }) {
  return (
    <ul className={cx('flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2', className)}>
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function StackedColumns<T extends Record<string, unknown>>({
  data,
  series,
  xLabel,
  tickEvery = 7,
  markerIndex,
  markerLabel,
  height = 220,
  ariaLabel,
}: {
  data: T[];
  series: ChartSeries[];
  xLabel: (row: T) => string;
  tickEvery?: number;
  markerIndex?: number;
  markerLabel?: string;
  height?: number;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 18, right: 4, bottom: 24, left: 30 };
  const plotW = Math.max(0, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const totals = data.map((d) => series.reduce((sum, s) => sum + Number(d[s.key] ?? 0), 0));
  const max = niceMax(Math.max(1, ...totals));
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, band - 3));
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-ink-3 text-[11px]">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
          {markerIndex != null && markerIndex >= 0 && (
            <g>
              <line
                x1={pad.left + band * (markerIndex + 0.5)}
                x2={pad.left + band * (markerIndex + 0.5)}
                y1={pad.top - 4}
                y2={pad.top + plotH}
                stroke="var(--ink-3)"
                strokeWidth={1}
              />
              {markerLabel && (
                <text x={pad.left + band * (markerIndex + 0.5) + 4} y={pad.top - 6} className="fill-ink-2 text-[11px] font-semibold">
                  {markerLabel}
                </text>
              )}
            </g>
          )}
          {data.map((d, i) => {
            const x = pad.left + band * i + (band - barW) / 2;
            let base = pad.top + plotH;
            const segs = series
              .map((s) => ({ s, v: Number(d[s.key] ?? 0) }))
              .filter((seg) => seg.v > 0);
            return (
              <g key={i} opacity={hover == null || hover === i ? 1 : 0.55}>
                {segs.map((seg, j) => {
                  const h = (seg.v / max) * plotH;
                  const top = base - h;
                  const gap = j > 0 ? 2 : 0;
                  const isTop = j === segs.length - 1;
                  const segH = Math.max(0, h - gap);
                  const el = isTop ? (
                    <path key={seg.s.key} d={topRounded(x, top, barW, segH, 4)} fill={seg.s.color} />
                  ) : (
                    <rect key={seg.s.key} x={x} y={top} width={barW} height={segH} fill={seg.s.color} />
                  );
                  base = top;
                  return el;
                })}
                {(i % tickEvery === 0 || i === markerIndex) && i !== markerIndex && (
                  <text x={pad.left + band * (i + 0.5)} y={height - 6} textAnchor="middle" className="fill-ink-3 text-[11px]">
                    {xLabel(d)}
                  </text>
                )}
                <rect
                  x={pad.left + band * i}
                  y={pad.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${xLabel(d)}: ${series.map((s) => `${s.label} ${Number(d[s.key] ?? 0)}`).join(', ')}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-pop"
          style={{
            left: Math.min(Math.max(pad.left + band * (hover + 0.5) - 72, 0), width - 150),
            top: 0,
          }}
        >
          <p className="mb-1 text-xs text-ink-3">{xLabel(data[hover])}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-2.5 rounded" style={{ background: s.color }} aria-hidden />
              <span className="num font-bold text-ink">{Number(data[hover][s.key] ?? 0)}</span>
              <span className="text-ink-3">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with the value at the tip; single series, so no legend. */
export function BarList({
  items,
  color = 'var(--chart-sched)',
  format = (v: number) => String(v),
  empty = 'No data yet.',
}: {
  items: { label: string; value: number; hint?: string; href?: string }[];
  color?: string;
  format?: (v: number) => string;
  empty?: string;
}) {
  if (!items.length) return <p className="text-sm text-ink-3">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-3 text-sm" title={item.hint}>
          <span className="truncate text-ink-2">{item.label}</span>
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 rounded-r-[4px]"
              style={{ width: `${Math.max(2, (item.value / max) * 82)}%`, background: color }}
              aria-hidden
            />
            <span className="num shrink-0 font-semibold text-ink">{format(item.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
