'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, fmt, toastError } from '@/lib/client';
import { Button, cx, Dialog, Empty, Field, IconButton, Input, PageHeader, Panel, Skeleton, table, Textarea } from '@/components/ui';

interface DepartmentRow {
  dept_id: number;
  name: string;
  location: string | null;
  description: string | null;
  doctor_count: number;
  upcoming_appointments: number;
  visits_90d: number;
  avg_consult_fee: number | null;
}

type Draft = { name: string; location: string; description: string };

export function DepartmentsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<DepartmentRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DepartmentRow | null>(null);
  const list = useQuery({ queryKey: ['departments'], queryFn: () => api<DepartmentRow[]>('/api/departments') });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/api/departments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`${deleting?.name} deleted`);
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => {
      setDeleting(null);
      toastError(err);
    },
  });

  const maxVisits = Math.max(1, ...(list.data ?? []).map((d) => d.visits_90d));

  return (
    <>
      <PageHeader
        title="Departments"
        description="Clinical departments and their current load, read from the view v_department_load."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            Add department
          </Button>
        }
      />

      <Panel bodyClassName="p-0">
        {list.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.isError ? (
          <Empty title="Departments could not be loaded.">{(list.error as Error).message}</Empty>
        ) : !list.data?.length ? (
          <Empty
            icon={<Building2 className="size-8" />}
            title="No departments yet."
            action={
              <Button variant="primary" onClick={() => setEditing('new')}>
                Add the first department
              </Button>
            }
          >
            Doctors are assigned to a department, so create departments before adding doctors.
          </Empty>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Department</th>
                  <th className={cx(table.th, 'text-right')}>Doctors</th>
                  <th className={cx(table.th, 'text-right')}>Upcoming</th>
                  <th className={table.th}>Visits, last 90 days</th>
                  <th className={cx(table.th, 'text-right')}>Average fee</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((d) => (
                  <tr key={d.dept_id} className={table.row}>
                    <td className={cx(table.td, 'max-w-[26rem]')}>
                      <div className="font-semibold text-ink">{d.name}</div>
                      <div className="text-xs text-ink-3">{d.location ?? 'No location set'}</div>
                      {d.description && <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{d.description}</p>}
                    </td>
                    <td className={cx(table.td, 'num text-right')}>{d.doctor_count}</td>
                    <td className={cx(table.td, 'num text-right')}>{d.upcoming_appointments}</td>
                    <td className={table.td}>
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 w-24 rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-core" style={{ width: `${(d.visits_90d / maxVisits) * 100}%` }} />
                        </span>
                        <span className="num text-ink-2">{d.visits_90d}</span>
                      </div>
                    </td>
                    <td className={cx(table.td, 'num text-right text-ink-2')}>
                      {d.avg_consult_fee != null ? fmt.money(d.avg_consult_fee) : '—'}
                    </td>
                    <td className={cx(table.td, 'text-right whitespace-nowrap')}>
                      <IconButton label={`Edit ${d.name}`} onClick={() => setEditing(d)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Delete ${d.name}`} onClick={() => setDeleting(d)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <DepartmentDialog dept={editing} onClose={() => setEditing(null)} />

      <Dialog
        open={deleting != null}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'department'}?`}
        description="This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep department
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => deleting && remove.mutate(deleting.dept_id)}>
              Delete department
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          {deleting && deleting.doctor_count > 0 ? (
            <>
              {deleting.doctor_count} doctor{deleting.doctor_count === 1 ? ' is' : 's are'} still assigned here. The foreign
              key <code className="font-mono text-[13px]">doctors.dept_id</code> is declared{' '}
              <code className="font-mono text-[13px]">ON DELETE RESTRICT</code>, so the database will refuse the delete
              until they move to another department.
            </>
          ) : (
            'No doctors are assigned, so the database will allow the delete.'
          )}
        </p>
      </Dialog>
    </>
  );
}

function DepartmentDialog({ dept, onClose }: { dept: DepartmentRow | 'new' | null; onClose: () => void }) {
  const isNew = dept === 'new';
  const current = dept && dept !== 'new' ? dept : null;
  return (
    <Dialog
      open={dept != null}
      onClose={onClose}
      title={isNew ? 'Add department' : `Edit ${current?.name}`}
      description="Department names are unique (UNIQUE departments_name_key)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="dept-form">
            {isNew ? 'Add department' : 'Save changes'}
          </Button>
        </>
      }
    >
      {dept != null && (
        <DepartmentForm
          key={current?.dept_id ?? 'new'}
          initial={{ name: current?.name ?? '', location: current?.location ?? '', description: current?.description ?? '' }}
          deptId={current?.dept_id ?? null}
          onDone={onClose}
        />
      )}
    </Dialog>
  );
}

function DepartmentForm({ initial, deptId, onDone }: { initial: Draft; deptId: number | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(initial);
  const save = useMutation({
    mutationFn: () =>
      deptId
        ? api(`/api/departments/${deptId}`, { method: 'PATCH', json: draft })
        : api('/api/departments', { method: 'POST', json: draft }),
    onSuccess: () => {
      toast.success(deptId ? 'Department updated' : `${draft.name} added`);
      qc.invalidateQueries({ queryKey: ['departments'] });
      onDone();
    },
    onError: toastError,
  });
  return (
    <form
      id="dept-form"
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Field label="Name">
        {(id) => <Input id={id} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}
      </Field>
      <Field label="Location" hint="Up to 60 characters, for example “Block B, Floor 3”.">
        {(id) => (
          <Input id={id} maxLength={60} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        )}
      </Field>
      <Field label="Description">
        {(id) => (
          <Textarea id={id} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        )}
      </Field>
      {save.isPending && <p className="text-xs text-ink-3">Saving…</p>}
    </form>
  );
}
