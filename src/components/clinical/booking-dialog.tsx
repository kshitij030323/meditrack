'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, fmt, toastError } from '@/lib/client';
import { Avatar, Button, cx, Dialog, Field, Input, Select, Skeleton, Textarea } from '../ui';
import type { DoctorRow, PatientRow, Role } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
  defaultPatientId?: number;
  defaultPatientName?: string;
  defaultDoctorId?: number;
  onBooked?: (appointmentId: number) => void;
}

/** The next 14 clinic days (Sundays are closed), as clinic-local YYYY-MM-DD. */
function bookableDays() {
  const days: { iso: string; weekday: string; label: string }[] = [];
  for (let offset = 0; days.length < 14 && offset < 20; offset++) {
    const d = new Date(Date.now() + offset * 86_400_000);
    const weekday = fmt.weekday(d);
    if (weekday === 'Sun') continue;
    days.push({ iso: fmt.isoDay(offset), weekday: offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : weekday, label: fmt.dateShort(d) });
  }
  return days;
}

export function BookingDialog({ open, onClose, role, defaultPatientId, defaultPatientName, defaultDoctorId, onBooked }: Props) {
  const qc = useQueryClient();
  const days = useMemo(bookableDays, []);
  const [patient, setPatient] = useState<{ id: number; name: string } | null>(null);
  const [deptId, setDeptId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [day, setDay] = useState(days[0]?.iso ?? '');
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api<DoctorRow[]>('/api/doctors'),
    enabled: open,
  });

  // Reset each time the dialog opens, applying any defaults.
  useEffect(() => {
    if (!open) return;
    setPatient(defaultPatientId ? { id: defaultPatientId, name: defaultPatientName ?? `Patient #${defaultPatientId}` } : null);
    setDoctorId(defaultDoctorId ?? '');
    setDeptId('');
    setDay(days[0]?.iso ?? '');
    setSlot(null);
    setReason('');
  }, [open, defaultPatientId, defaultPatientName, defaultDoctorId, days]);

  useEffect(() => {
    if (defaultDoctorId && doctorId === defaultDoctorId && doctors.data && deptId === '') {
      const d = doctors.data.find((x) => x.doctor_id === defaultDoctorId);
      if (d) setDeptId(d.dept_id);
    }
  }, [defaultDoctorId, doctorId, doctors.data, deptId]);

  const departments = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of doctors.data ?? []) map.set(d.dept_id, d.department);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [doctors.data]);
  const deptDoctors = (doctors.data ?? []).filter((d) => deptId === '' || d.dept_id === deptId);

  const slots = useQuery({
    queryKey: ['slots', doctorId, day],
    queryFn: () => api<string[]>(`/api/doctors/${doctorId}/slots?date=${day}`),
    enabled: open && doctorId !== '' && !!day,
  });

  const book = useMutation({
    mutationFn: () =>
      api<{ appointment_id: number }>('/api/appointments', {
        method: 'POST',
        json: { patient_id: patient?.id, doctor_id: doctorId, scheduled_at: slot, reason: reason.trim() || null },
      }),
    onSuccess: (res) => {
      const doc = doctors.data?.find((d) => d.doctor_id === doctorId);
      toast.success('Appointment booked', {
        description: `${fmt.dateTime(slot!)} with Dr. ${doc?.full_name ?? ''}`,
      });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
      qc.invalidateQueries({ queryKey: ['patient'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onBooked?.(res.appointment_id);
      onClose();
    },
    onError: (err) => {
      toastError(err);
      qc.invalidateQueries({ queryKey: ['slots'] });
      setSlot(null);
    },
  });

  const needsPatient = role !== 'patient';
  const ready = (!needsPatient || patient) && doctorId !== '' && slot;
  const selectedDoctor = doctors.data?.find((d) => d.doctor_id === doctorId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Book an appointment"
      description="Times are clinic time (IST). Slots already taken, past times and Sundays are not offered."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!ready}
            loading={book.isPending}
            icon={<CalendarCheck className="size-4" />}
            onClick={() => book.mutate()}
          >
            Book appointment
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {needsPatient && <PatientPicker value={patient} onChange={setPatient} locked={!!defaultPatientId} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department">
            {(id) => (
              <Select
                id={id}
                value={deptId}
                onChange={(e) => {
                  setDeptId(e.target.value ? Number(e.target.value) : '');
                  setDoctorId('');
                  setSlot(null);
                }}
              >
                <option value="">All departments</option>
                {departments.map(([idv, name]) => (
                  <option key={idv} value={idv}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Doctor" hint={selectedDoctor ? `${selectedDoctor.specialization}, consultation ${fmt.money(selectedDoctor.consult_fee)}` : undefined}>
            {(id) => (
              <Select
                id={id}
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value ? Number(e.target.value) : '');
                  setSlot(null);
                }}
              >
                <option value="">Choose a doctor</option>
                {deptDoctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    Dr. {d.full_name} ({d.department})
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Day</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Day">
            {days.map((d) => (
              <button
                key={d.iso}
                type="button"
                role="radio"
                aria-checked={day === d.iso}
                onClick={() => {
                  setDay(d.iso);
                  setSlot(null);
                }}
                className={cx(
                  'flex min-w-[64px] flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-colors',
                  day === d.iso ? 'border-core bg-core-soft text-core' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                <span className="text-[11px] font-semibold">{d.weekday}</span>
                <span className="num text-sm font-bold">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Time</p>
          {doctorId === '' ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-ink-3">
              Choose a doctor to see their free slots.
            </p>
          ) : slots.isLoading ? (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : (slots.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-ink-3">
              No free slots on this day. Try another day.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6" role="radiogroup" aria-label="Time">
              {slots.data!.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={slot === s}
                  onClick={() => setSlot(s)}
                  className={cx(
                    'num h-9 rounded-md border text-sm font-semibold transition-colors',
                    slot === s ? 'border-core bg-core text-white' : 'border-line bg-surface text-ink hover:border-core/60',
                  )}
                >
                  {fmt.time(s)}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label="Reason for visit" hint="Optional, up to 200 characters.">
          {(id) => (
            <Textarea
              id={id}
              rows={2}
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="For example: follow-up on blood sugar, cough for a week"
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}

function PatientPicker({
  value,
  onChange,
  locked,
}: {
  value: { id: number; name: string } | null;
  onChange: (v: { id: number; name: string } | null) => void;
  locked: boolean;
}) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);
  const results = useQuery({
    queryKey: ['patients', 'picker', debounced],
    queryFn: () => api<PatientRow[]>(`/api/patients?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2 && !value,
  });

  if (value) {
    return (
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Patient</p>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-muted px-3 py-2">
          <Avatar name={value.name} tone="ref" size="sm" />
          <span className="flex-1 font-semibold">{value.name}</span>
          {!locked && (
            <Button size="sm" variant="ghost" icon={<X className="size-3.5" />} onClick={() => onChange(null)}>
              Change
            </Button>
          )}
        </div>
      </div>
    );
  }
  return (
    <Field label="Patient">
      {(id) => (
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-ink-3" />
          <Input id={id} className="pl-9" placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          {debounced.length >= 2 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-line bg-surface p-1">
              {results.isLoading && <li className="px-3 py-2 text-sm text-ink-3">Searching…</li>}
              {results.data?.length === 0 && <li className="px-3 py-2 text-sm text-ink-3">No patient matches “{debounced}”.</li>}
              {results.data?.slice(0, 6).map((p) => (
                <li key={p.patient_id}>
                  <button
                    type="button"
                    onClick={() => onChange({ id: p.patient_id, name: p.full_name })}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Avatar name={p.full_name} tone="ref" size="sm" />
                    <span className="flex-1 text-sm font-semibold">{p.full_name}</span>
                    <span className="text-xs text-ink-3">
                      {p.age} y, {p.gender}, {p.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}
