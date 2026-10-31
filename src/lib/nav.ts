import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  Database,
  FileHeart,
  History,
  LayoutGrid,
  MessageSquareText,
  Pill,
  Search,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './auth';

/** Domain colour of a section, matching the schema-diagram legend. */
export type Domain = 'core' | 'vector' | 'ref' | 'audit' | 'neutral';

export interface NavItem {
  href: string;
  label: string;
  patientLabel?: string;
  icon: LucideIcon;
  roles: Role[];
  domain: Domain;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Clinic',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['admin', 'doctor', 'patient'], domain: 'core' },
      { href: '/appointments', label: 'Appointments', patientLabel: 'My appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'patient'], domain: 'core' },
      { href: '/patients', label: 'Patients', icon: Users, roles: ['doctor'], domain: 'core' },
      { href: '/patients/me', label: 'My health record', icon: FileHeart, roles: ['patient'], domain: 'core' },
    ],
  },
  {
    group: 'Clinical intelligence',
    items: [
      { href: '/triage', label: 'Triage', icon: Activity, roles: ['doctor'], domain: 'vector' },
      { href: '/search', label: 'Medical search', icon: Search, roles: ['doctor', 'admin'], domain: 'vector' },
      { href: '/assistant', label: 'Ask MediTrack', icon: MessageSquareText, roles: ['doctor'], domain: 'vector' },
    ],
  },
  {
    group: 'Reference',
    items: [{ href: '/medications', label: 'Formulary', icon: Pill, roles: ['doctor', 'admin'], domain: 'ref' }],
  },
  {
    group: 'Administration',
    items: [
      { href: '/departments', label: 'Departments', icon: Building2, roles: ['admin'], domain: 'core' },
      { href: '/users', label: 'Users', icon: UserCog, roles: ['admin'], domain: 'core' },
      { href: '/audit', label: 'Prescription audit', icon: History, roles: ['admin'], domain: 'audit' },
      { href: '/db-lab', label: 'DB Lab', icon: Database, roles: ['admin'], domain: 'audit' },
    ],
  },
  {
    group: 'Project',
    items: [{ href: '/about', label: 'About MediTrack', icon: BookOpen, roles: ['admin', 'doctor', 'patient'], domain: 'neutral' }],
  },
];

export function canAccess(pathname: string, role: Role): boolean {
  const items = NAV.flatMap((g) => g.items);
  const match = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? match.roles.includes(role) : true;
}
