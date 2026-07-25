/**
 * KSP RBAC mirror (client-side guard; server enforces separately).
 * Reference: FRONTEND_ARCHITECTURE.md #4, functions/common/rbac.ts.
 * Must stay in sync with the backend role list.
 */
export const ROLES = [
  'DEVELOPER',
  'SUPER_ADMIN',
  'SCRB_ANALYST',
  'DISTRICT_COMMAND',
  'SHO',
  'IO',
  'DATA_OPERATOR',
  'AUDITOR',
  'VIEWER',
] as const;

export type Role = (typeof ROLES)[number];

export interface MeResponse {
  userProfileId: number;
  role: Role;
  districtId: number | null;
  unitId: number | null;
  employeeId: number | null;
  permissions: {
    canSeePii: boolean;
    canExport: boolean;
    isAdmin: boolean;
    canReadAudit: boolean;
    isStateScope: boolean;
  };
  home: string;
}

export function defaultHome(role: Role): string {
  switch (role) {
    case 'DEVELOPER':
    case 'SUPER_ADMIN':
    case 'SCRB_ANALYST':
      return '/hub';
    case 'DISTRICT_COMMAND':
      return '/district';
    case 'SHO':
    case 'DATA_OPERATOR':
    case 'IO':
      return '/station';
    case 'AUDITOR':
      return '/audit';
    case 'VIEWER':
      return '/hub';
  }
}

export function canAccessRoute(route: string, role: Role): boolean {
  if (role === 'DEVELOPER') return true;
  if (route === '/login' || route === '/' || route === '/forbidden') return true;
  if (route === '/hub')
    return role === 'SUPER_ADMIN' || role === 'SCRB_ANALYST' || role === 'VIEWER';
  if (route === '/district')
    return role === 'DISTRICT_COMMAND' || role === 'SCRB_ANALYST' || role === 'SUPER_ADMIN';
  if (route === '/station')
    return (
      role === 'SHO' ||
      role === 'DATA_OPERATOR' ||
      role === 'IO' ||
      role === 'SCRB_ANALYST' ||
      role === 'SUPER_ADMIN'
    );
  if (route === '/cases') return true;
  if (route === '/network')
    return (
      role === 'SUPER_ADMIN' ||
      role === 'SCRB_ANALYST' ||
      role === 'DISTRICT_COMMAND' ||
      role === 'SHO' ||
      role === 'IO'
    );
  if (route === '/predict')
    return role === 'SUPER_ADMIN' || role === 'SCRB_ANALYST' || role === 'DISTRICT_COMMAND';
  if (route === '/reports')
    return role === 'SUPER_ADMIN' || role === 'SCRB_ANALYST' || role === 'DISTRICT_COMMAND';
  if (route === '/admin') return role === 'SUPER_ADMIN';
  if (route === '/audit') return role === 'SUPER_ADMIN' || role === 'AUDITOR';
  return false;
}
