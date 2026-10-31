'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackageX, Pill, Plus, Search, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, fmt, toastError } from '@/lib/client';
import {
  Badge,
  Button,
  cx,
  Dialog,
  Drawer,
  Empty,
  Field,
  IconButton,
  Input,
  PageHeader,
  Panel,
  Segmented,
  Select,
  Skeleton,
  StatusBadge,
  table,
  Tabs,
  Textarea,
} from '@/components/ui';

export interface MedicationRow {
  medication_id: number;
  name: string;
  form: string;
  strength: string | null;
  drug_class: string | null;
  description: string | null;
  unit_price: number;
  stock_qty: number;
  reorder_level: number;
  low_stock: boolean;
  units_dispensed_30d: number;
  times_prescribed: number;
}

interface MedicationDetail extends MedicationRow {
  interactions: { interaction_id: number; severity: string; description: string; medication_id: number; name: string }[];
  usage: { diagnosis: string; times: number; avg_days: number }[];
}

interface InteractionRow {
  interaction_id: number;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  a_id: number;
  a_name: string;
  b_id: number;
  b_name: string;
}

const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops'] as const;

export function MedicationsView({ role }: { role: 'admin' | 'doctor' }) {
  const isAdmin = role === 'admin';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openId = Number(searchParams.get('open')) || null;
  const [tab, setTab] = useState<'formulary' | 'interactions'>('formulary');
  const [addOpen, setAddOpen] = useState(false);

  const setOpen = (id: number | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (id) sp.set('open', String(id));
    else sp.delete('open');
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const all = useQuery({ queryKey: ['medications', 'all'], queryFn: () => api<MedicationRow[]>('/api/medications') });
  const interactions = useQuery({ queryKey: ['interactions'], queryFn: () => api<InteractionRow[]>('/api/interactions') });

  return (
    <>
      <PageHeader
        title="Formulary"
        description="Medicines stocked by the hospital pharmacy. Issuing a prescription reserves stock through a database trigger, and deleting a prescription line returns it."
        actions={
          isAdmin && (
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>
              Add medication
            </Button>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        tabs={[
          { value: 'formulary', label: 'Formulary', count: all.data?.length },
          { value: 'interactions', label: 'Interactions', count: interactions.data?.length },
        ]}
      />
      {tab === 'formulary' ? (
        <FormularyTab onOpen={setOpen} />
      ) : (
        <InteractionsTab isAdmin={isAdmin} meds={all.data ?? []} query={interactions} onOpen={setOpen} />
      )}
      <MedicationDrawer id={openId} isAdmin={isAdmin} onClose={() => setOpen(null)} onOpen={setOpen} />
      {isAdmin && <AddMedicationDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={setOpen} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Formulary table
// ---------------------------------------------------------------------------
function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function FormularyTab({ onOpen }: { onOpen: (id: number) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const dq = useDebounced(q.trim());
  const list = useQuery({
    queryKey: ['medications', dq, filter],
    queryFn: () => api<MedicationRow[]>(`/api/medications?q=${encodeURIComponent(dq)}${filter === 'low' ? '&low=1' : ''}`),
    placeholderData: (prev) => prev,
  });
  const lowCount = useMemo(() => list.data?.filter((m) => m.low_stock).length ?? 0, [list.data]);

  return (
    <Panel bodyClassName="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or drug class"
              aria-label="Filter medications"
              className="pl-9"
            />
          </div>
          <Segmented
            label="Stock filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'low', label: 'Low stock only' },
            ]}
          />
        </div>
        {list.data && (
          <span className="text-[13px] text-ink-3">
            {list.data.length} medicines{lowCount ? `, ${lowCount} at or below reorder level` : ''}
          </span>
        )}
      </div>
      {list.isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : list.isError ? (
        <Empty title="The formulary could not be loaded." className="py-12">
          {(list.error as Error).message}
        </Empty>
      ) : !list.data?.length ? (
        <Empty icon={<PackageX className="size-8" />} title="No medicines match." className="py-12">
          {filter === 'low' ? 'Every medicine is above its reorder level.' : 'Try a generic name or a drug class such as “antibiotic”.'}
        </Empty>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Medicine</th>
                <th className={table.th}>Class</th>
                <th className={table.th}>Stock vs reorder level</th>
                <th className={cx(table.th, 'text-right')}>Dispensed, 30 days</th>
                <th className={cx(table.th, 'text-right')}>Unit price</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((m) => (
                <tr
                  key={m.medication_id}
                  className={cx(table.row, 'cursor-pointer')}
                  onClick={() => onOpen(m.medication_id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(m.medication_id))}
                  tabIndex={0}
                  aria-label={`Open ${m.name}`}
                >
                  <td className={table.td}>
                    <div className="font-semibold text-ink">{m.name}</div>
                    <div className="text-xs text-ink-3">
                      {[m.strength, m.form].filter(Boolean).join(' ')}
                    </div>
                  </td>
                  <td className={cx(table.td, 'text-ink-2')}>{m.drug_class ?? '—'}</td>
                  <td className={table.td}>
                    <StockMeter stock={m.stock_qty} reorder={m.reorder_level} low={m.low_stock} />
                  </td>
                  <td className={cx(table.td, 'num text-right text-ink-2')}>{m.units_dispensed_30d}</td>
                  <td className={cx(table.td, 'num text-right text-ink-2')}>{fmt.money(m.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Stock bar scaled so the reorder level sits at a quarter of the track. */
export function StockMeter({ stock, reorder, low }: { stock: number; reorder: number; low: boolean }) {
  const scale = Math.max(reorder * 4, stock, 1);
  const pct = Math.min(100, (stock / scale) * 100);
  const mark = Math.min(100, (reorder / scale) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 w-28 shrink-0 rounded-full bg-muted" title={`${stock} in stock, reorder at ${reorder}`}>
        <div className={cx('absolute inset-y-0 left-0 rounded-full', low ? 'bg-danger' : 'bg-ref')} style={{ width: `${pct}%` }} />
        <div className="absolute -inset-y-1 w-px bg-ink-3" style={{ left: `${mark}%` }} aria-hidden />
      </div>
      <span className="num w-10 text-right font-mono text-[13px] text-ink">{stock}</span>
      {low && <Badge tone="danger">Low stock</Badge>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------------
function MedicationDrawer({
  id,
  isAdmin,
  onClose,
  onOpen,
}: {
  id: number | null;
  isAdmin: boolean;
  onClose: () => void;
  onOpen: (id: number) => void;
}) {
  const detail = useQuery({
    queryKey: ['medication', id],
    queryFn: () => api<MedicationDetail>(`/api/medications/${id}`),
    enabled: id != null,
  });
  const m = detail.data;

  return (
    <Drawer
      open={id != null}
      onClose={onClose}
      title={m ? `${m.name}${m.strength ? ` ${m.strength}` : ''}` : 'Medicine'}
      subtitle={m ? [m.drug_class, m.form].filter(Boolean).join(', ') : undefined}
    >
      {detail.isLoading || !m ? (
        detail.isError ? (
          <Empty title="This medicine could not be loaded.">{(detail.error as Error).message}</Empty>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
          </div>
        )
      ) : (
        <div className="space-y-7">
          {m.description && <p className="text-[15px] leading-relaxed text-ink-2">{m.description}</p>}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-line bg-muted px-4 py-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-3">In stock</dt>
              <dd className={cx('num text-lg font-bold', m.low_stock ? 'text-danger' : 'text-ink')}>{m.stock_qty}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Reorder at</dt>
              <dd className="num text-lg font-bold text-ink">{m.reorder_level}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Dispensed, 30 days</dt>
              <dd className="num text-lg font-bold text-ink">{m.units_dispensed_30d}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Unit price</dt>
              <dd className="num text-lg font-bold text-ink">{fmt.money(m.unit_price)}</dd>
            </div>
          </dl>

          {isAdmin && <EditMedication key={m.medication_id} med={m} />}

          <section>
            <h3 className="mb-2 text-[15px] font-bold">Known interactions</h3>
            {m.interactions.length === 0 ? (
              <p className="text-sm text-ink-3">No interactions recorded for this medicine.</p>
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {m.interactions.map((it) => (
                  <li key={it.interaction_id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={it.severity} />
                      <button
                        type="button"
                        onClick={() => onOpen(it.medication_id)}
                        className="font-semibold text-ink underline-offset-2 hover:underline"
                      >
                        {it.name}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{it.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Prescribed for</h3>
            <p className="mb-2 text-xs text-ink-3">Diagnoses on visits where this medicine was prescribed (JOIN + GROUP BY).</p>
            {m.usage.length === 0 ? (
              <p className="text-sm text-ink-3">Not prescribed yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {m.usage.map((u) => {
                  const max = Math.max(...m.usage.map((x) => x.times));
                  return (
                    <li key={u.diagnosis} className="grid grid-cols-[minmax(0,1fr)_7rem_4.5rem] items-center gap-3 text-sm">
                      <span className="truncate text-ink">{u.diagnosis}</span>
                      <span className="h-1.5 rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-ref" style={{ width: `${(u.times / max) * 100}%` }} />
                      </span>
                      <span className="num text-right text-xs text-ink-3">
                        {u.times}x, {u.avg_days} d
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function EditMedication({ med }: { med: MedicationDetail }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    stock_qty: String(med.stock_qty),
    unit_price: String(med.unit_price),
    reorder_level: String(med.reorder_level),
    description: med.description ?? '',
  });
  const dirty =
    form.stock_qty !== String(med.stock_qty) ||
    form.unit_price !== String(med.unit_price) ||
    form.reorder_level !== String(med.reorder_level) ||
    form.description !== (med.description ?? '');

  const save = useMutation({
    mutationFn: () =>
      api<{ ok: boolean; reembedded: boolean }>(`/api/medications/${med.medication_id}`, {
        method: 'PATCH',
        json: {
          stock_qty: form.stock_qty,
          unit_price: form.unit_price,
          reorder_level: form.reorder_level,
          description: form.description,
        },
      }),
    onSuccess: (res) => {
      toast.success('Medicine updated', {
        description: res.reembedded ? 'The new description was re-embedded for semantic search.' : undefined,
      });
      qc.invalidateQueries({ queryKey: ['medications'] });
      qc.invalidateQueries({ queryKey: ['medication', med.medication_id] });
    },
    onError: toastError,
  });

  return (
    <form
      className="rounded-lg border border-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h3 className="text-[15px] font-bold">Pharmacy details</h3>
      <p className="mb-3 text-xs text-ink-3">
        Stock cannot go below zero (CHECK chk_med_stock). Changing the description re-computes its embedding.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Stock">
          {(id) => (
            <Input id={id} type="number" inputMode="numeric" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
          )}
        </Field>
        <Field label="Reorder at">
          {(id) => (
            <Input id={id} type="number" inputMode="numeric" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          )}
        </Field>
        <Field label="Unit price (₹)">
          {(id) => (
            <Input id={id} type="number" step="0.01" inputMode="decimal" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          )}
        </Field>
      </div>
      <Field label="Description and indications" className="mt-3">
        {(id) => <Textarea id={id} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
      </Field>
      <div className="mt-3 flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={!dirty} loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Add medication
// ---------------------------------------------------------------------------
const emptyMed = {
  name: '',
  form: 'tablet',
  strength: '',
  drug_class: '',
  description: '',
  stock_qty: '100',
  unit_price: '0',
  reorder_level: '40',
};

function AddMedicationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyMed);
  const set = (k: keyof typeof emptyMed) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const create = useMutation({
    mutationFn: () => api<{ medication_id: number }>('/api/medications', { method: 'POST', json: form }),
    onSuccess: (res) => {
      toast.success(`${form.name} added to the formulary`, { description: 'Its description was embedded for semantic search.' });
      qc.invalidateQueries({ queryKey: ['medications'] });
      setForm(emptyMed);
      onClose();
      onCreated(res.medication_id);
    },
    onError: toastError,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add medication"
      description="The description is embedded with the MiniLM model when you save, so the medicine shows up in natural-language search."
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" form="add-med" type="submit" loading={create.isPending} icon={<Pill className="size-4" />}>
            Add medication
          </Button>
        </>
      }
    >
      <form
        id="add-med"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Generic name" className="sm:col-span-2">
          {(id) => <Input id={id} required value={form.name} onChange={set('name')} placeholder="e.g. Pantoprazole" />}
        </Field>
        <Field label="Form">
          {(id) => (
            <Select id={id} value={form.form} onChange={set('form')}>
              {FORMS.map((f) => (
                <option key={f} value={f}>
                  {f[0].toUpperCase() + f.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Strength">{(id) => <Input id={id} value={form.strength} onChange={set('strength')} placeholder="40 mg" />}</Field>
        <Field label="Drug class" className="sm:col-span-2">
          {(id) => <Input id={id} value={form.drug_class} onChange={set('drug_class')} placeholder="Proton pump inhibitor" />}
        </Field>
        <Field label="Description and indications" className="sm:col-span-2" hint="Plain language works best for search, for example “reduces stomach acid for reflux and ulcers”.">
          {(id) => <Textarea id={id} rows={3} value={form.description} onChange={set('description')} />}
        </Field>
        <Field label="Opening stock">
          {(id) => <Input id={id} type="number" value={form.stock_qty} onChange={set('stock_qty')} />}
        </Field>
        <Field label="Reorder at">
          {(id) => <Input id={id} type="number" value={form.reorder_level} onChange={set('reorder_level')} />}
        </Field>
        <Field label="Unit price (₹)">
          {(id) => <Input id={id} type="number" step="0.01" value={form.unit_price} onChange={set('unit_price')} />}
        </Field>
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------
const SEVERITY_ORDER = ['severe', 'moderate', 'minor'] as const;
const SEVERITY_COPY: Record<(typeof SEVERITY_ORDER)[number], string> = {
  severe: 'Blocked inside one prescription by the trigger trg_rx_items_validate.',
  moderate: 'Shown to the prescriber as a warning.',
  minor: 'Shown to the prescriber for information.',
};

function InteractionsTab({
  isAdmin,
  meds,
  query,
  onOpen,
}: {
  isAdmin: boolean;
  meds: MedicationRow[];
  query: { data?: InteractionRow[]; isLoading: boolean; isError: boolean; error: unknown };
  onOpen: (id: number) => void;
}) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<InteractionRow | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/interactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Interaction removed');
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ['interactions'] });
      qc.invalidateQueries({ queryKey: ['medication'] });
    },
    onError: toastError,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (query.isError) return <Empty title="Interactions could not be loaded.">{(query.error as Error).message}</Empty>;

  const rows = query.data ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-sm text-ink-2">
          Each pair is stored once with the lower medication id first (CHECK chk_di_distinct), and duplicates are
          rejected by UNIQUE uq_di_pair.
        </p>
        {isAdmin && (
          <Button icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>
            Add interaction
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty title="No interactions recorded yet.">Add pairs that prescribers should be warned about.</Empty>
      ) : (
        SEVERITY_ORDER.map((sev) => {
          const group = rows.filter((r) => r.severity === sev);
          if (!group.length) return null;
          return (
            <Panel
              key={sev}
              bodyClassName="p-0"
              title={
                <span className="flex items-center gap-2">
                  <StatusBadge status={sev} />
                  <span className="num text-ink-3">{group.length}</span>
                </span>
              }
              description={SEVERITY_COPY[sev]}
            >
              <ul className="divide-y divide-line">
                {group.map((r) => (
                  <li key={r.interaction_id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        <button type="button" className="hover:underline" onClick={() => onOpen(r.a_id)}>
                          {r.a_name}
                        </button>
                        <span className="px-1.5 font-normal text-ink-3">with</span>
                        <button type="button" className="hover:underline" onClick={() => onOpen(r.b_id)}>
                          {r.b_name}
                        </button>
                      </p>
                      <p className="mt-0.5 text-sm text-ink-2">{r.description}</p>
                    </div>
                    {isAdmin && (
                      <IconButton label={`Remove interaction ${r.a_name} with ${r.b_name}`} onClick={() => setConfirm(r)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })
      )}

      {isAdmin && <AddInteractionDialog open={addOpen} onClose={() => setAddOpen(false)} meds={meds} />}
      <Dialog
        open={confirm != null}
        onClose={() => setConfirm(null)}
        title="Remove this interaction?"
        description={confirm ? `${confirm.a_name} with ${confirm.b_name} will no longer trigger a warning or a block.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => confirm && remove.mutate(confirm.interaction_id)}>
              Remove interaction
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">{confirm?.description}</p>
      </Dialog>
    </div>
  );
}

function AddInteractionDialog({ open, onClose, meds }: { open: boolean; onClose: () => void; meds: MedicationRow[] }) {
  const qc = useQueryClient();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');
  const [description, setDescription] = useState('');
  const sorted = useMemo(() => [...meds].sort((x, y) => x.name.localeCompare(y.name)), [meds]);

  const create = useMutation({
    mutationFn: () => api('/api/interactions', { method: 'POST', json: { a_id: a, b_id: b, severity, description } }),
    onSuccess: () => {
      toast.success('Interaction recorded');
      qc.invalidateQueries({ queryKey: ['interactions'] });
      qc.invalidateQueries({ queryKey: ['medication'] });
      setA('');
      setB('');
      setDescription('');
      onClose();
    },
    onError: toastError,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add interaction"
      description="Choosing the same medicine twice is rejected by the database (CHECK chk_di_distinct)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-interaction" loading={create.isPending}>
            Record interaction
          </Button>
        </>
      }
    >
      <form
        id="add-interaction"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['First medicine', a, setA],
            ['Second medicine', b, setB],
          ].map(([label, value, setter]) => (
            <Field key={label as string} label={label as string}>
              {(id) => (
                <Select id={id} required value={value as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}>
                  <option value="">Choose…</option>
                  {sorted.map((m) => (
                    <option key={m.medication_id} value={m.medication_id}>
                      {m.name} {m.strength ?? ''}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Severity</p>
          <Segmented
            label="Severity"
            value={severity}
            onChange={setSeverity}
            options={[
              { value: 'minor', label: 'Minor' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'severe', label: 'Severe' },
            ]}
          />
          {severity === 'severe' && (
            <p className="mt-1.5 text-xs text-danger">Severe pairs can no longer be prescribed together.</p>
          )}
        </div>
        <Field label="What happens and what to do">
          {(id) => (
            <Textarea
              id={id}
              required
              minLength={5}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mechanism, clinical effect and the safer alternative."
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
