import { describe, it, expect } from 'vitest';
import { caseScopeFilter, isVisible } from '@ksp/common/scope';
import type { Scope } from '@ksp/common/scope';
import type { Role } from '@ksp/common/rbac';

function scope(role: Role, over: Partial<Scope> = {}): Scope {
  return { role, active: true, ...over };
}

describe('caseScopeFilter (RBAC scope table)', () => {
  it('state roles get no filter', () => {
    expect(caseScopeFilter(scope('SUPER_ADMIN'))).toEqual({ state: true });
    expect(caseScopeFilter(scope('SCRB_ANALYST'))).toEqual({ state: true });
  });

  it('DISTRICT_COMMAND filters by districtId', () => {
    expect(caseScopeFilter(scope('DISTRICT_COMMAND', { districtId: 443 }))).toEqual({
      districtId: 443,
    });
  });

  it('DISTRICT_COMMAND without districtId denies all', () => {
    expect(caseScopeFilter(scope('DISTRICT_COMMAND'))).toEqual({ denyAll: true });
  });

  it('SHO filters by unitId', () => {
    expect(caseScopeFilter(scope('SHO', { unitId: 60006 }))).toEqual({ unitId: 60006 });
  });

  it('IO uses employeeOrUnit branch', () => {
    expect(caseScopeFilter(scope('IO', { employeeId: 10042, unitId: 60006 }))).toEqual({
      employeeOrUnit: { employeeId: 10042, unitId: 60006 },
    });
  });

  it('VIEWER sees demo data only', () => {
    expect(caseScopeFilter(scope('VIEWER'))).toEqual({ demoOnly: true });
  });

  it('inactive profile denies all', () => {
    expect(caseScopeFilter(scope('SHO', { unitId: 60006, active: false }))).toEqual({
      denyAll: true,
    });
  });
});

describe('isVisible (in-memory row check)', () => {
  const row = {
    districtId: 443,
    policeStationId: 60006,
    policePersonId: 10042,
    isDemo: false,
  };

  it('SCRB sees everything', () => {
    expect(isVisible(scope('SCRB_ANALYST'), row)).toBe(true);
  });

  it('SHO only sees own unit', () => {
    expect(isVisible(scope('SHO', { unitId: 60006 }), row)).toBe(true);
    expect(isVisible(scope('SHO', { unitId: 99999 }), row)).toBe(false);
  });

  it('VIEWER only sees demo rows', () => {
    expect(isVisible(scope('VIEWER'), row)).toBe(false);
    expect(isVisible(scope('VIEWER'), { ...row, isDemo: true })).toBe(true);
  });
});
