'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CalendarPlus, CalendarX, FileHeart, Stethoscope, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookingDialog } from '@/components/clinical/booking-dialog';
import type { DoctorRow, Role, ScheduleRow } from '@/components/clinical/types';
import { Avatar, Button, ButtonLink, cx, Dialog, Empty, PageHeader, Segmented, Select, Skeleton, StatusBadge } from '@/components/ui';
import { api, fmt, toastError } from '@/lib/client';

type Range = 'today' | 'week' | 'upcoming' | 'past';

function rangeParams(range: Range): { from: string | null; to: string | null } {
  switch (range) {
    case 'today':
      return { from: fmt.isoDay(0), to: fmt.isoDay(0) };
    case 'week':
      return { from: fmt.isoDay(0), to: fmt.isoDay(7) };
    case 'upcoming':
      return { from: fmt.isoDay(0), to: null };
    case 'past':
      return { from: fmt.isoDay(-120), to: fmt.isoDay(-1) };
  }
}

function dayHeading(localDate: string): string {
  if (localDate === fmt.isoDay(0)) return 'Today';
  if (localDate === fmt.isoDay(1)) return 'Tomorrow';
  if (localDate === fmt.isoDay(-1)) return 'Yesterday';
  const d = new Date(`${localDate}T12:00:00+05:30`);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });
}

type PendingAction = { appt: ScheduleRow; status: 'cancelled' | 'no_show' } | null;

export function AppointmentsView({ userId, role }: { userId: number; role: Role }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [range, setRange] = useState<Range>(role === 'patient' ? 'upcoming' : 'today');
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);

  useEffect(() => {
    if (searchParams.get('book') === '1') setBookingOpen(true);
  }, [searchParams]);

  const { from, to } = rangeParams(range);
  const appointments = useQuery({
    queryKey: ['appointments', range, status, doctorId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      if (status) p.set('status', status);
      if (doctorId) p.set('doctor_id', doctorId);
      return api<ScheduleRow[]>(`/api/appointments?${p}`);
    },
  });
  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api<DoctorRow[]>('/api/doctors'),
    enabled: role === 'admin',
  });

  const groups = useMemo(() => {
    const rows = [...(appointments.data ?? [])];
    if (range === 'past') rows.reverse();
    const map = new Map<string, ScheduleRow[]>();
    for (const r of rows) map.set(r.local_date, [...(map.get(r.local_date) ?? []), r]);
    return [...map.entries()];
  }, [appointments.data, range]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of appointments.data ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [appointments.data]);

  const changeStatus = useMutation({
    mutationFn: (p: NonNullable<PendingAction>) =>
      api(`/api/appointments/${p.appt.appointment_id}`, { method: 'PATCH', json: { status: p.status } }),
    onSuccess: (_d, p) => {
      toast.success(p.status === 'cancelled' ? 'Appointment cancelled' : 'Marked as no-show');
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setPending(null);
    },
    onError: (err) => {
      toastError(err);
      setPending(null);
    },
  });

  const today = fmt.isoDay(0);
  const total = appointments.data?.length ?? 0;

  return (
    <>
      <PageHeader
        title={role === 'patient' ? 'My appointments' : role === 'doctor' ? 'My schedule' : 'Appointments'}
        description={
          role === 'patient'
            ? 'Book a consultation, see what is coming up, or cancel a booking you no longer need.'
            : role === 'doctor'
              ? 'Your consultations. Start a consultation from today’s queue to record the visit.'
              : 'Every booking across departments. Bookings go through the sp_book_appointment procedure, which locks the doctor’s row so two people can’t take the same slot.'
        }
        actions={
          <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => setBookingOpen(true)}>
            Book appointment
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Range>
          label="Date range"
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Next 7 days' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
        />
        <Select aria-label="Status" className="w-auto min-w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No-show</option>
        </Select>
        {role === 'admin' && (
          <Select aria-label="Doctor" className="w-auto min-w-[200px]" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">All doctors</option>
            {doctors.data?.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>
                Dr. {d.full_name} ({d.department})
              </option>
            ))}
          </Select>
        )}
        {total > 0 && (
          <p className="num ml-auto text-sm text-ink-3">
            {total} {total === 1 ? 'appointment' : 'appointments'}
            {counts.scheduled ? `, ${counts.scheduled} scheduled` : ''}
            {counts.completed ? `, ${counts.completed} completed` : ''}
            {counts.no_show ? `, ${counts.no_show} no-show` : ''}
            {counts.cancelled ? `, ${counts.cancelled} cancelled` : ''}
          </p>
        )}
      </div>

      {appointments.isLoading ? (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : appointments.isError ? (
        <div className="rounded-xl border border-line bg-surface">
          <Empty title="The schedule didn’t load" action={<Button onClick={() => appointments.refetch()}>Try again</Button>}>
            {(appointments.error as Error).message}
          </Empty>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <Empty
            icon={<CalendarDays className="size-8" />}
            title={range === 'today' ? 'Nothing scheduled today' : 'No appointments in this range'}
            action={
              <Button icon={<CalendarPlus className="size-4" />} onClick={() => setBookingOpen(true)}>
                Book appointment
              </Button>
            }
          >
            Try another date range or status, or book a new appointment.
          </Empty>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, rows]) => (
            <section key={date} aria-labelledby={`day-${date}`}>
              <h2 id={`day-${date}`} className="mb-2 flex items-baseline gap-2 text-[15px] font-bold text-ink">
                {dayHeading(date)}
                <span className="num text-xs font-normal text-ink-3">
                  {fmt.date(`${date}T12:00:00+05:30`)}, {rows.length} {rows.length === 1 ? 'booking' : 'bookings'}
                </span>
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {rows.map((a) => (
                  <AppointmentRow
                    key={a.appointment_id}
                    appt={a}
                    role={role}
                    userId={userId}
                    today={today}
                    onAction={(s) => setPending({ appt: a, status: s })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BookingDialog
        open={bookingOpen}
        role={role}
        defaultDoctorId={role === 'doctor' ? userId : undefined}
        onClose={() => {
          setBookingOpen(false);
          if (searchParams.get('book')) router.replace('/appointments');
        }}
      />

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.status === 'cancelled' ? 'Cancel this appointment?' : 'Mark as no-show?'}
        description={
          pending
            ? `${fmt.dateTime(pending.appt.scheduled_at)}, ${pending.appt.patient_name} with Dr. ${pending.appt.doctor_name}`
            : undefined
        }
        footer={
          <>
            <Button onClick={() => setPending(null)}>Keep it</Button>
            <Button
              variant="danger"
              loading={changeStatus.isPending}
              onClick={() => pending && changeStatus.mutate(pending)}
            >
              {pending?.status === 'cancelled' ? 'Cancel appointment' : 'Mark as no-show'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          {pending?.status === 'cancelled'
            ? 'The slot becomes free for someone else straight away.'
            : 'The appointment is kept in the record as missed.'}{' '}
          Status changes are final: the trigger trg_appt_status_guard only lets a scheduled appointment move once.
        </p>
      </Dialog>
    </>
  );
}

function AppointmentRow({
  appt: a,
  role,
  userId,
  today,
  onAction,
}: {
  appt: ScheduleRow;
  role: Role;
  userId: number;
  today: string;
  onAction: (status: 'cancelled' | 'no_show') => void;
}) {
  const isPast = new Date(a.scheduled_at).getTime() < Date.now();
  const ownDoctor = role === 'doctor' && a.doctor_id === userId;
  const canConsult = ownDoctor && a.status === 'scheduled' && a.local_date <= today;
  const canCancel = a.status === 'scheduled' && (role === 'patient' || role === 'admin' || ownDoctor);
  const canNoShow = a.status === 'scheduled' && isPast && (role === 'admin' || ownDoctor);
  const chartHref = role === 'doctor' ? `/patients/${a.patient_id}` : role === 'patient' ? '/patients/me' : null;

  return (
    <li
      className={cx(
        'grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center',
        a.status === 'cancelled' && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-2 sm:block">
        <p className="num text-[15px] font-bold text-ink">{fmt.time(a.scheduled_at)}</p>
        <StatusBadge status={a.status} className="sm:mt-1" />
      </div>

      <div className="flex min-w-0 items-start gap-3">
        {role === 'patient' ? (
          <Avatar name={a.doctor_name} tone="core" size="sm" />
        ) : (
          <Avatar name={a.patient_name} tone="ref" size="sm" />
        )}
        <div className="min-w-0">
          {role === 'patient' ? (
            <p className="font-semibold text-ink">
              Dr. {a.doctor_name} <span className="font-normal text-ink-3">{a.department}</span>
            </p>
          ) : (
            <p className="font-semibold text-ink">
              {role === 'doctor' ? (
                <Link href={`/patients/${a.patient_id}`} className="hover:underline">
                  {a.patient_name}
                </Link>
              ) : (
                a.patient_name
              )}{' '}
              <span className="font-normal text-ink-3">
                {a.patient_age} y, {a.patient_gender}
              </span>
            </p>
          )}
          {role === 'admin' && (
            <p className="text-[13px] text-ink-2">
              with Dr. {a.doctor_name}, {a.department}
            </p>
          )}
          {a.reason && <p className="truncate text-[13px] text-ink-3">{a.reason}</p>}
          {a.diagnosis && (
            <p className="text-[13px] text-ink-2">
              Diagnosis: <span className="font-semibold">{a.diagnosis}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        {canConsult && (
          <ButtonLink href={`/consult/${a.appointment_id}`} variant="primary" size="sm" icon={<Stethoscope className="size-4" />}>
            Start consultation
          </ButtonLink>
        )}
        {a.status === 'completed' && chartHref && (
          <ButtonLink href={chartHref} size="sm" icon={<FileHeart className="size-4" />}>
            View record
          </ButtonLink>
        )}
        {canNoShow && (
          <Button size="sm" variant="ghost" icon={<UserX className="size-4" />} onClick={() => onAction('no_show')}>
            No-show
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="ghost" icon={<CalendarX className="size-4" />} onClick={() => onAction('cancelled')}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  );
}
