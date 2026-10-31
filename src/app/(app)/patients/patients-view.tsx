'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PatientRow } from '@/components/clinical/types';
import { Avatar, Badge, Button, Empty, Input, PageHeader, Skeleton, table } from '@/components/ui';
import { api, fmt } from '@/lib/client';

export function PatientsView() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const patients = useQuery({
    queryKey: ['patients', 'directory', debounced],
    queryFn: () => api<PatientRow[]>(`/api/patients${debounced ? `?q=${encodeURIComponent(debounced)}` : ''}`),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search by name, even with a typo (trigram similarity on a GIN index), or by the start of a phone number."
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-ink-3" />
        <Input
          aria-label="Search patients"
          className="pl-9"
          placeholder="Search patients, for example “priya” or “98450”"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {patients.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : patients.isError ? (
          <Empty title="The patient list didn’t load" action={<Button onClick={() => patients.refetch()}>Try again</Button>}>
            {(patients.error as Error).message}
          </Empty>
        ) : (patients.data ?? []).length === 0 ? (
          <Empty icon={<Users className="size-8" />} title={`No patient matches “${debounced}”`}>
            Check the spelling or search by phone number instead.
          </Empty>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Patient</th>
                  <th className={table.th}>Age</th>
                  <th className={`${table.th} hidden md:table-cell`}>Blood</th>
                  <th className={`${table.th} hidden md:table-cell`}>Phone</th>
                  <th className={`${table.th} text-right`}>Visits</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Last visit</th>
                  <th className={`${table.th} hidden lg:table-cell`}>Next appointment</th>
                </tr>
              </thead>
              <tbody>
                {patients.data!.map((p) => (
                  <tr
                    key={p.patient_id}
                    className={`${table.row} cursor-pointer`}
                    onClick={() => router.push(`/patients/${p.patient_id}`)}
                  >
                    <td className={table.td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.full_name} tone="ref" size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/patients/${p.patient_id}`}
                            className="font-semibold text-ink hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.full_name}
                          </Link>
                          <p className="text-xs text-ink-3 capitalize">
                            {p.gender}
                            {!p.is_active && ', inactive account'}
                          </p>
                        </div>
                        {p.no_show_count > 1 && <Badge tone="warn">{p.no_show_count} no-shows</Badge>}
                      </div>
                    </td>
                    <td className={`${table.td} num`}>{p.age}</td>
                    <td className={`${table.td} hidden md:table-cell`}>{p.blood_group ?? '—'}</td>
                    <td className={`${table.td} num hidden font-mono text-[13px] md:table-cell`}>{p.phone}</td>
                    <td className={`${table.td} num text-right font-semibold`}>{p.visit_count}</td>
                    <td className={`${table.td} hidden text-ink-2 sm:table-cell`}>
                      {p.last_visit_at ? fmt.date(p.last_visit_at) : 'No visits yet'}
                    </td>
                    <td className={`${table.td} hidden text-ink-2 lg:table-cell`}>
                      {p.next_appointment_at ? fmt.dateTime(p.next_appointment_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
