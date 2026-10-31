'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Search, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, fmt, toastError } from '@/lib/client';
import {
  Avatar,
  Badge,
  Button,
  cx,
  Dialog,
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
  Textarea,
} from '@/components/ui';

type Role = 'admin' | 'doctor' | 'patient';

interface UserRow {
  user_id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  department: string | null;
  dept_id: number | null;
  specialization: string | null;
  license_no: string | null;
  consult_fee: number | null;
  years_exp: number | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
}

interface Department {
  dept_id: number;
  name: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function ageFrom(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

export function UsersView({ currentUserId }: { currentUserId: number }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<'all' | Role>('all');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ['users', role, dq],
    queryFn: () =>
      api<UserRow[]>(`/api/users?${new URLSearchParams({ ...(role !== 'all' ? { role } : {}), ...(dq ? { q: dq } : {}) })}`),
    placeholderData: (prev) => prev,
  });

  const toggle = useMutation({
    mutationFn: (u: UserRow) => api(`/api/users/${u.user_id}`, { method: 'PATCH', json: { is_active: !u.is_active } }),
    onSuccess: (_d, u) => {
      toast.success(u.is_active ? `${u.full_name} deactivated` : `${u.full_name} reactivated`, {
        description: u.is_active ? 'Their next request is refused, even with a valid session.' : undefined,
      });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: toastError,
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff and patient accounts. Passwords are stored only as bcrypt hashes, and field formats such as phone numbers and fees are checked by database constraints."
        actions={
          <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            Add user
          </Button>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: 'all', label: 'All' },
                { value: 'admin', label: 'Admins' },
                { value: 'doctor', label: 'Doctors' },
                { value: 'patient', label: 'Patients' },
              ]}
            />
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name or email"
                aria-label="Search users"
                className="pl-9"
              />
            </div>
          </div>
          {list.data && <span className="text-[13px] text-ink-3">{list.data.length} accounts</span>}
        </div>
        {list.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.isError ? (
          <Empty title="Users could not be loaded.">{(list.error as Error).message}</Empty>
        ) : !list.data?.length ? (
          <Empty icon={<Users className="size-8" />} title="No accounts match.">
            Clear the search or pick another role.
          </Empty>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Role</th>
                  <th className={table.th}>Details</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Joined</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((u) => {
                  const self = u.user_id === currentUserId;
                  return (
                    <tr key={u.user_id} className={cx(table.row, !u.is_active && 'opacity-60')}>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.full_name}
                            size="sm"
                            tone={u.role === 'admin' ? 'audit' : u.role === 'doctor' ? 'core' : 'ref'}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink">
                              {u.role === 'doctor' ? `Dr. ${u.full_name}` : u.full_name}
                              {self && <span className="ml-1.5 text-xs font-normal text-ink-3">(you)</span>}
                            </div>
                            <div className="truncate text-xs text-ink-3">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className={table.td}>
                        <StatusBadge status={u.role} />
                      </td>
                      <td className={cx(table.td, 'text-[13px] text-ink-2')}>
                        {u.role === 'doctor' ? (
                          <>
                            <div>{u.specialization}</div>
                            <div className="text-xs text-ink-3">
                              {u.department}, {u.years_exp} yrs, {u.consult_fee != null ? fmt.money(u.consult_fee) : '—'}
                            </div>
                          </>
                        ) : u.role === 'patient' ? (
                          <>
                            <div>
                              {ageFrom(u.dob)} y, {u.gender}
                              {u.blood_group ? `, ${u.blood_group}` : ''}
                            </div>
                            <div className="num font-mono text-xs text-ink-3">{u.phone}</div>
                          </>
                        ) : (
                          <span className="text-ink-3">Administrator</span>
                        )}
                      </td>
                      <td className={table.td}>
                        {u.is_active ? <Badge tone="ok">Active</Badge> : <Badge>Inactive</Badge>}
                      </td>
                      <td className={cx(table.td, 'text-[13px] whitespace-nowrap text-ink-3')}>{fmt.date(u.created_at)}</td>
                      <td className={cx(table.td, 'text-right whitespace-nowrap')}>
                        <IconButton label={`Edit ${u.full_name}`} onClick={() => setEditing(u)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label={`Reset password for ${u.full_name}`} onClick={() => setResetting(u)}>
                          <KeyRound className="size-4" />
                        </IconButton>
                        <IconButton
                          label={self ? 'You cannot deactivate your own account' : u.is_active ? `Deactivate ${u.full_name}` : `Reactivate ${u.full_name}`}
                          disabled={self || toggle.isPending}
                          onClick={() => toggle.mutate(u)}
                        >
                          {u.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AddUserDialog open={adding} onClose={() => setAdding(false)} />
      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Add user
// ---------------------------------------------------------------------------
const blank = {
  full_name: '',
  email: '',
  password: '',
  dept_id: '',
  license_no: '',
  specialization: '',
  consult_fee: '500',
  years_exp: '0',
  dob: '',
  gender: 'female',
  blood_group: '',
  phone: '',
  address: '',
  emergency_contact: '',
};

function useDepartments(enabled: boolean) {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/api/departments'),
    enabled,
  });
}

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('patient');
  const [f, setF] = useState(blank);
  const departments = useDepartments(open);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const create = useMutation({
    mutationFn: () => {
      const base = { role, full_name: f.full_name, email: f.email, password: f.password };
      const body =
        role === 'doctor'
          ? { ...base, dept_id: f.dept_id, license_no: f.license_no, specialization: f.specialization, consult_fee: f.consult_fee, years_exp: f.years_exp }
          : role === 'patient'
            ? { ...base, dob: f.dob, gender: f.gender, blood_group: f.blood_group || null, phone: f.phone, address: f.address || null, emergency_contact: f.emergency_contact || null }
            : base;
      return api<{ user_id: number }>('/api/users', { method: 'POST', json: body });
    },
    onSuccess: () => {
      toast.success(`${f.full_name} can now sign in`, {
        description: role === 'admin' ? undefined : `The users row and ${role}s row were inserted in one transaction.`,
      });
      qc.invalidateQueries({ queryKey: ['users'] });
      setF(blank);
      onClose();
    },
    onError: toastError,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add user"
      description="Values are checked by the database, so a malformed phone number or email is rejected with the name of the rule it broke."
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-user" loading={create.isPending} icon={<UserPlus className="size-4" />}>
            Create account
          </Button>
        </>
      }
    >
      <form
        id="add-user"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4"
      >
        <Segmented
          label="Account role"
          value={role}
          onChange={setRole}
          options={[
            { value: 'patient', label: 'Patient' },
            { value: 'doctor', label: 'Doctor' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name">{(id) => <Input id={id} required value={f.full_name} onChange={set('full_name')} />}</Field>
          <Field label="Email" hint="Stored in lowercase (CHECK chk_users_email).">
            {(id) => <Input id={id} required value={f.email} onChange={set('email')} autoComplete="off" />}
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Hashed with bcrypt before it is stored.">
            {(id) => <Input id={id} type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete="new-password" />}
          </Field>
        </div>

        {role === 'doctor' && (
          <fieldset className="grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <legend className="sr-only">Doctor profile</legend>
            <Field label="Department">
              {(id) => (
                <Select id={id} required value={f.dept_id} onChange={set('dept_id')}>
                  <option value="">Choose a department…</option>
                  {departments.data?.map((d) => (
                    <option key={d.dept_id} value={d.dept_id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Specialization">{(id) => <Input id={id} required value={f.specialization} onChange={set('specialization')} />}</Field>
            <Field label="License number" hint="Unique across doctors.">
              {(id) => <Input id={id} required value={f.license_no} onChange={set('license_no')} placeholder="KMC-2019-012345" />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fee (₹)" hint="0 to 100000">
                {(id) => <Input id={id} type="number" value={f.consult_fee} onChange={set('consult_fee')} />}
              </Field>
              <Field label="Years" hint="0 to 60">
                {(id) => <Input id={id} type="number" value={f.years_exp} onChange={set('years_exp')} />}
              </Field>
            </div>
          </fieldset>
        )}

        {role === 'patient' && (
          <fieldset className="grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <legend className="sr-only">Patient profile</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth">{(id) => <Input id={id} type="date" required value={f.dob} onChange={set('dob')} />}</Field>
              <Field label="Gender">
                {(id) => (
                  <Select id={id} value={f.gender} onChange={set('gender')}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </Select>
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" hint="10 digits">
                {(id) => <Input id={id} required inputMode="tel" value={f.phone} onChange={set('phone')} />}
              </Field>
              <Field label="Blood group">
                {(id) => (
                  <Select id={id} value={f.blood_group} onChange={set('blood_group')}>
                    <option value="">Unknown</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Field label="Address" className="sm:col-span-2">
              {(id) => <Textarea id={id} rows={2} value={f.address} onChange={set('address')} />}
            </Field>
            <Field label="Emergency contact" hint="10 digits, optional">
              {(id) => <Input id={id} inputMode="tel" value={f.emergency_contact} onChange={set('emergency_contact')} />}
            </Field>
          </fieldset>
        )}
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit / reset password
// ---------------------------------------------------------------------------
function EditUserDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const qc = useQueryClient();
  const departments = useDepartments(user.role === 'doctor');
  const [f, setF] = useState({
    full_name: user.full_name,
    dept_id: String(user.dept_id ?? ''),
    specialization: user.specialization ?? '',
    consult_fee: String(user.consult_fee ?? ''),
    years_exp: String(user.years_exp ?? ''),
    phone: user.phone ?? '',
    address: user.address ?? '',
    emergency_contact: user.emergency_contact ?? '',
    blood_group: user.blood_group ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = useMutation({
    mutationFn: () => {
      const body =
        user.role === 'doctor'
          ? { full_name: f.full_name, dept_id: f.dept_id, specialization: f.specialization, consult_fee: f.consult_fee, years_exp: f.years_exp }
          : user.role === 'patient'
            ? { full_name: f.full_name, phone: f.phone, address: f.address, emergency_contact: f.emergency_contact, blood_group: f.blood_group }
            : { full_name: f.full_name };
      return api(`/api/users/${user.user_id}`, { method: 'PATCH', json: body });
    },
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: toastError,
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${user.full_name}`}
      description={user.email}
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="edit-user" loading={save.isPending}>
            Save profile
          </Button>
        </>
      }
    >
      <form
        id="edit-user"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Full name" className="sm:col-span-2">
          {(id) => <Input id={id} required value={f.full_name} onChange={set('full_name')} />}
        </Field>
        {user.role === 'doctor' && (
          <>
            <Field label="Department">
              {(id) => (
                <Select id={id} value={f.dept_id} onChange={set('dept_id')}>
                  {departments.data?.map((d) => (
                    <option key={d.dept_id} value={d.dept_id}>
                      {d.name}
                    </option>
                  )) ?? <option value={f.dept_id}>{user.department}</option>}
                </Select>
              )}
            </Field>
            <Field label="Specialization">{(id) => <Input id={id} value={f.specialization} onChange={set('specialization')} />}</Field>
            <Field label="Fee (₹)">{(id) => <Input id={id} type="number" value={f.consult_fee} onChange={set('consult_fee')} />}</Field>
            <Field label="Years of experience">{(id) => <Input id={id} type="number" value={f.years_exp} onChange={set('years_exp')} />}</Field>
          </>
        )}
        {user.role === 'patient' && (
          <>
            <Field label="Phone" hint="10 digits">{(id) => <Input id={id} value={f.phone} onChange={set('phone')} />}</Field>
            <Field label="Blood group">
              {(id) => (
                <Select id={id} value={f.blood_group} onChange={set('blood_group')}>
                  <option value="">Unknown</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Address" className="sm:col-span-2">
              {(id) => <Textarea id={id} rows={2} value={f.address} onChange={set('address')} />}
            </Field>
            <Field label="Emergency contact" hint="10 digits, optional">
              {(id) => <Input id={id} value={f.emergency_contact} onChange={set('emergency_contact')} />}
            </Field>
          </>
        )}
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const reset = useMutation({
    mutationFn: () => api(`/api/users/${user.user_id}`, { method: 'PATCH', json: { password } }),
    onSuccess: () => {
      toast.success(`Password reset for ${user.full_name}`, { description: 'Share it with them securely.' });
      onClose();
    },
    onError: toastError,
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title="Reset password"
      description={`Set a new password for ${user.full_name}. Only its bcrypt hash is stored.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="reset-pw" loading={reset.isPending} icon={<KeyRound className="size-4" />}>
            Reset password
          </Button>
        </>
      }
    >
      <form
        id="reset-pw"
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate();
        }}
      >
        <Field label="New password" hint="At least 8 characters.">
          {(id) => (
            <Input id={id} type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
