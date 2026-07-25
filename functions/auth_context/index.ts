/**
 * Auth context Function — GET /api/v1/me
 * Authenticated. Returns caller role, districtId, unitId, permissions.
 * Reference: IMPLEMENTATION2.md 1B, API_REFERENCE.md "GET /api/v1/me".
 *
 * STUB until 1B: returns PROFILE_REQUIRED (auth not wired yet).
 */
import { logger, newRequestId } from '../common/logger';
import { toResponse, ok } from '../common/errors';
import { requireAuth } from '../common/auth';
import { canSeePii, canExport, isAdmin, canReadAudit, isStateScope, defaultHome } from '../common/rbac';
import { config } from '../common/config';

export default async function me(ctx: unknown) {
  const requestId = newRequestId();
  try {
    const { profile, scope } = await requireAuth(ctx, requestId);
    const cfg = config();
    logger.info('me.fetch', {
      requestId,
      route: '/me',
      userId: profile.catalystUserId,
      role: profile.role,
    });
    return ok({
      userProfileId: profile.userProfileId,
      role: profile.role,
      districtId: profile.districtId ?? null,
      unitId: profile.unitId ?? null,
      employeeId: profile.employeeId ?? null,
      permissions: {
        canSeePii: canSeePii(profile.role, cfg.piiRoles),
        canExport: canExport(profile.role, cfg.exportRoles),
        isAdmin: isAdmin(profile.role),
        canReadAudit: canReadAudit(profile.role),
        isStateScope: isStateScope(profile.role),
      },
      home: defaultHome(profile.role),
      scope,
    });
  } catch (err) {
    const { status, body } = toResponse(err, requestId);
    return { status, body };
  }
}
