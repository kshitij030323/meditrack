'use client';

import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { useState } from 'react';
import { api, fmt } from '@/lib/client';
import { Button, cx, Empty, PageHeader, Panel, Segmented, Skeleton, Stat, StatusBadge } from '@/components/ui';

interface ItemImage {
  item_id: number;
  prescription_id: number;
  medication_id: number;
  dosage: string;
  frequency: string;
  duration_days: number;
}

interface AuditRow {
  audit_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_at: string;
  changed_by: number | null;
  changed_by_name: string | null;
  changed_by_role: string | null;
  item_id: number | null;
  prescription_id: number | null;
  medication_name: string | null;
  patient_name: string | null;
  old_data: ItemImage | null;
  new_data: ItemImage | null;
}

type Filter = 'all' | AuditRow['action'];

const VERB: Record<AuditRow['action'], string> = { INSERT: 'prescribed', UPDATE: 'changed', DELETE: 'removed' };
const FIELD_LABEL: Record<string, string> = {
  dosage: 'dosage',
  frequency: 'frequency',
  duration_days: 'days',
  medication_id: 'medication id',
};

export function AuditView() {
  const [filter, setFilter] = useState<Filter>('all');
  const log = useQuery({
    queryKey: ['audit', filter],
    queryFn: () => api<AuditRow[]>(`/api/audit?limit=200${filter !== 'all' ? `&action=${filter}` : ''}`),
    placeholderData: (prev) => prev,
  });
  // Totals come from a GROUP BY on the server, not from counting rows here.
  const all = useQuery({
    queryKey: ['audit', 'summary'],
    queryFn: () => api<Partial<Record<'INSERT' | 'UPDATE' | 'DELETE', number>>>('/api/audit?summary=1'),
  });
  const counts = { INSERT: all.data?.INSERT ?? 0, UPDATE: all.data?.UPDATE ?? 0, DELETE: all.data?.DELETE ?? 0 };
  const [shown, setShown] = useState(25);

  return (
    <>
      <PageHeader
        title="Prescription audit"
        description={
          <>
            Every change to a prescription line is written by the trigger{' '}
            <code className="font-mono text-[14px] text-audit">trg_rx_items_audit</code> with before and after images. The
            person responsible comes from the transaction-local setting{' '}
            <code className="font-mono text-[14px] text-audit">app.user_id</code>, which the API sets at the start of each
            write.
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Lines prescribed (INSERT)" value={all.isLoading ? '…' : counts.INSERT} tone="ok" />
        <Stat label="Lines changed (UPDATE)" value={all.isLoading ? '…' : counts.UPDATE} tone="audit" />
        <Stat label="Lines removed (DELETE)" value={all.isLoading ? '…' : counts.DELETE} tone="danger" />
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <Segmented
            label="Action"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'INSERT', label: 'INSERT' },
              { value: 'UPDATE', label: 'UPDATE' },
              { value: 'DELETE', label: 'DELETE' },
            ]}
          />
          {log.data && (
            <span className="text-[13px] text-ink-3">Latest {log.data.length} events from v_prescription_audit_log</span>
          )}
        </div>
        {log.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : log.isError ? (
          <Empty title="The audit log could not be loaded.">{(log.error as Error).message}</Empty>
        ) : !log.data?.length ? (
          <Empty icon={<History className="size-8" />} title="No audit events yet.">
            Events appear here as soon as a doctor issues, edits or removes a prescription line.
          </Empty>
        ) : (
          <>
            <ol className="divide-y divide-line">
              {log.data.slice(0, shown).map((r) => (
                <AuditEntry key={r.audit_id} row={r} />
              ))}
            </ol>
            {log.data.length > shown && (
              <div className="border-t border-line px-5 py-3 text-center">
                <Button size="sm" onClick={() => setShown((n) => n + 25)}>
                  Show 25 more
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}

function AuditEntry({ row }: { row: AuditRow }) {
  const who = row.changed_by_name
    ? row.changed_by_role === 'doctor'
      ? `Dr. ${row.changed_by_name}`
      : row.changed_by_name
    : 'System';
  const image = row.new_data ?? row.old_data;
  return (
    <li className="grid grid-cols-1 gap-x-4 gap-y-1.5 px-5 py-3.5 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
      <div className="pt-0.5">
        <StatusBadge status={row.action} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink">
          <span className="font-semibold">{who}</span> {VERB[row.action]}{' '}
          <span className="font-semibold">{row.medication_name ?? `medication #${image?.medication_id ?? '?'}`}</span>
          {row.patient_name && (
            <>
              {' '}
              for <span className="font-semibold">{row.patient_name}</span>
            </>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Diff row={row} />
        </div>
        <p className="mt-1 text-xs text-ink-3">
          Audit #{row.audit_id}, prescription #{row.prescription_id ?? '?'}, item #{row.item_id ?? '?'}
          {row.action === 'DELETE' && ' (item_id kept only in old_data; the row is gone)'}
        </p>
      </div>
      <div className="text-xs whitespace-nowrap text-ink-3 sm:text-right">
        <div className="text-ink-2">{fmt.dateTime(row.changed_at)}</div>
        <div>{fmt.relative(row.changed_at)}</div>
      </div>
    </li>
  );
}

const chip = 'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[12px]';

function Diff({ row }: { row: AuditRow }) {
  if (row.action === 'UPDATE' && row.old_data && row.new_data) {
    const changed = (Object.keys(FIELD_LABEL) as (keyof ItemImage)[]).filter(
      (k) => String(row.old_data![k]) !== String(row.new_data![k]),
    );
    if (!changed.length) return <span className="text-xs text-ink-3">No field changed</span>;
    return (
      <>
        {changed.map((k) => (
          <span key={k} className={cx(chip, 'border-audit/25 bg-audit-soft text-ink')}>
            <span className="text-ink-3">{FIELD_LABEL[k]}</span>
            <span className="text-danger line-through decoration-danger/60">{String(row.old_data![k])}</span>
            <span className="text-ink-3" aria-label="changed to">
              →
            </span>
            <span className="font-semibold text-ok">{String(row.new_data![k])}</span>
          </span>
        ))}
      </>
    );
  }
  const img = row.new_data ?? row.old_data;
  if (!img) return null;
  return (
    <span
      className={cx(
        chip,
        row.action === 'DELETE' ? 'border-danger/25 bg-danger-soft text-ink-2 line-through decoration-danger/50' : 'border-line bg-muted text-ink-2',
      )}
    >
      {img.dosage}, {img.frequency}, {img.duration_days} {img.duration_days === 1 ? 'day' : 'days'}
    </span>
  );
}
