'use client';

import { useQuery } from '@tanstack/react-query';
import { OctagonAlert, Pill, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { api, FREQUENCIES } from '@/lib/client';
import { cx, IconButton, Input, Select, Spinner } from '../ui';
import type { InteractionHit, MedicationRow } from './types';

export interface DraftItem {
  key: string;
  medication: Pick<MedicationRow, 'medication_id' | 'name' | 'strength' | 'form' | 'stock_qty'>;
  dosage: string;
  frequency: string;
  duration_days: number;
}

const DOSES_PER_DAY: Record<string, number> = { OD: 1, BD: 2, TDS: 3, QID: 4, HS: 1, SOS: 1 };

/** Mirrors fn_units_required() so the doctor sees the stock the trigger will reserve. */
export function unitsRequired(form: string, frequency: string, days: number): number {
  if (frequency === 'STAT') return 1;
  if (['tablet', 'capsule', 'injection'].includes(form)) return Math.ceil((DOSES_PER_DAY[frequency] ?? 1) * days);
  return 1;
}

export function defaultDosage(m: Pick<MedicationRow, 'form' | 'strength'>): string {
  if (m.form === 'syrup') return '5 ml';
  if (m.form === 'drops') return '2 drops';
  if (m.form === 'ointment') return 'Apply thin layer';
  return m.strength ?? '1 unit';
}

let keySeq = 0;
export function newItem(m: DraftItem['medication']): DraftItem {
  keySeq += 1;
  return { key: `rx-${keySeq}`, medication: m, dosage: defaultDosage(m), frequency: 'BD', duration_days: 5 };
}

/** Typeahead over the formulary (GET /api/medications?q=). */
export function MedicationPicker({
  onPick,
  exclude = [],
  autoFocus,
}: {
  onPick: (m: MedicationRow) => void;
  exclude?: number[];
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['medications', 'picker', debounced],
    queryFn: () => api<MedicationRow[]>(`/api/medications?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });
  const options = (data ?? []).filter((m) => !exclude.includes(m.medication_id)).slice(0, 8);

  const choose = (m: MedicationRow) => {
    onPick(m);
    setQ('');
    setDebounced('');
    setOpen(false);
    setActive(0);
  };

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-ink-3" />
      <Input
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-label="Add a medication"
        autoFocus={autoFocus}
        className="pl-9"
        placeholder="Add a medication by name or class"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!options.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(options[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {isFetching && <Spinner className="absolute top-2.5 right-3" />}
      {open && debounced.length >= 2 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-pop"
        >
          {options.length === 0 && !isFetching && (
            <li className="px-3 py-2 text-sm text-ink-3">No medication matches “{debounced}”.</li>
          )}
          {options.map((m, i) => (
            <li key={m.medication_id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(m)}
                className={cx(
                  'flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left',
                  i === active ? 'bg-muted' : '',
                )}
              >
                <Pill className="mt-0.5 size-4 shrink-0 text-ref" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {m.name} <span className="font-normal text-ink-2">{m.strength}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-3">
                    {[m.drug_class, m.form].filter(Boolean).join(', ')}
                  </span>
                </span>
                <span className={cx('num text-xs whitespace-nowrap', m.low_stock ? 'font-semibold text-warn' : 'text-ink-3')}>
                  {m.stock_qty} in stock
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Live interaction check for a set of medications (fn_check_interactions). */
export function useInteractions(ids: number[]) {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  return useQuery({
    queryKey: ['interactions', 'check', sorted],
    queryFn: () => api<InteractionHit[]>('/api/medications/check', { method: 'POST', json: { ids: sorted } }),
    enabled: sorted.length >= 2,
    placeholderData: (prev) => prev,
  });
}

/** Drops stale hits (from placeholder data) that involve a medication no longer in the list. */
export function currentHits(hits: InteractionHit[] | undefined, ids: number[]): InteractionHit[] {
  if (!hits || ids.length < 2) return [];
  const set = new Set(ids);
  return hits.filter((h) => set.has(h.medication_a_id) && set.has(h.medication_b_id));
}

export function InteractionWarnings({ hits }: { hits: InteractionHit[] }) {
  if (!hits.length) return null;
  return (
    <ul className="space-y-2">
      {hits.map((h) => {
        const severe = h.severity === 'severe';
        return (
          <li
            key={h.interaction_id}
            className={cx(
              'flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
              severe ? 'border-danger/30 bg-danger-soft' : h.severity === 'moderate' ? 'border-warn/30 bg-warn-soft' : 'border-line bg-muted',
            )}
          >
            {severe ? (
              <OctagonAlert className="mt-0.5 size-4 shrink-0 text-danger" />
            ) : (
              <TriangleAlert className={cx('mt-0.5 size-4 shrink-0', h.severity === 'moderate' ? 'text-warn' : 'text-ink-3')} />
            )}
            <div className="min-w-0">
              <p className={cx('font-semibold', severe ? 'text-danger' : h.severity === 'moderate' ? 'text-warn' : 'text-ink-2')}>
                {h.severity === 'severe' ? 'Severe' : h.severity === 'moderate' ? 'Moderate' : 'Minor'} interaction:{' '}
                {h.medication_a} with {h.medication_b}
              </p>
              <p className="mt-0.5 text-ink-2">{h.description}</p>
              {severe && (
                <p className="mt-1 text-xs font-semibold text-danger">
                  The database trigger trg_rx_items_validate will reject this combination. Remove one of them.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Editable list of prescription lines with stock and interaction feedback. */
export function PrescriptionBuilder({
  items,
  onChange,
}: {
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
}) {
  const interactions = useInteractions(items.map((i) => i.medication.medication_id));
  const update = (key: string, patch: Partial<DraftItem>) =>
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {items.map((it) => {
            const units = unitsRequired(it.medication.form, it.frequency, it.duration_days || 0);
            const short = units > it.medication.stock_qty;
            return (
              <li key={it.key} className="px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {it.medication.name} <span className="font-normal text-ink-2">{it.medication.strength}</span>
                    </p>
                    <p className={cx('num text-xs', short ? 'font-semibold text-danger' : 'text-ink-3')}>
                      {it.medication.form}, reserves {units} {units === 1 ? 'unit' : 'units'} of {it.medication.stock_qty} in stock
                      {short ? '. Not enough stock: the database will reject this line.' : ''}
                    </p>
                  </div>
                  <IconButton label={`Remove ${it.medication.name}`} onClick={() => onChange(items.filter((x) => x.key !== it.key))}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1.3fr_1.2fr_0.7fr]">
                  <label className="text-xs text-ink-3">
                    Dosage
                    <Input
                      className="mt-1"
                      value={it.dosage}
                      maxLength={40}
                      onChange={(e) => update(it.key, { dosage: e.target.value })}
                    />
                  </label>
                  <label className="text-xs text-ink-3">
                    Frequency
                    <Select className="mt-1" value={it.frequency} onChange={(e) => update(it.key, { frequency: e.target.value })}>
                      {FREQUENCIES.map((f) => (
                        <option key={f.code} value={f.code}>
                          {f.code}: {f.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-xs text-ink-3">
                    Days
                    <Input
                      className="num mt-1"
                      type="number"
                      min={1}
                      max={180}
                      value={it.duration_days}
                      onChange={(e) => update(it.key, { duration_days: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <MedicationPicker
        exclude={items.map((i) => i.medication.medication_id)}
        onPick={(m) => onChange([...items, newItem(m)])}
      />
      {items.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          <Plus className="size-3.5" /> Search the formulary to add the first line. Leave empty if no medication is needed.
        </p>
      )}
      <InteractionWarnings hits={currentHits(interactions.data, items.map((i) => i.medication.medication_id))} />
    </div>
  );
}
