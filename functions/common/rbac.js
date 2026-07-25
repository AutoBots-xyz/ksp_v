"use strict";
/**
 * Role constants & permission flags.
 * Role codes are immutable strings (CONFIGURATION.md #5).
 * Permission flags are DERIVED from role in code, never from client claims (SECURITY.md).
 *
 * Reference: README.md RBAC table, FRONTEND_ARCHITECTURE.md, BACKEND_ARCHITECTURE.md #4.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = void 0;
exports.isRole = isRole;
exports.canSeePii = canSeePii;
exports.canExport = canExport;
exports.isAdmin = isAdmin;
exports.canReadAudit = canReadAudit;
exports.isStateScope = isStateScope;
exports.defaultHome = defaultHome;
exports.canAccessRoute = canAccessRoute;
exports.ROLES = [
    'SUPER_ADMIN',
    'SCRB_ANALYST',
    'DISTRICT_COMMAND',
    'SHO',
    'IO',
    'DATA_OPERATOR',
    'AUDITOR',
    'VIEWER',
];
function isRole(r) {
    return typeof r === 'string' && exports.ROLES.includes(r);
}
/** Roles that can read full PII (names, caste, religion, age). */
function canSeePii(role, piiRoles) {
    return piiRoles.includes(role);
}
/** Roles that can export / generate reports. */
function canExport(role, exportRoles) {
    return exportRoles.includes(role);
}
/** Roles that can access the admin console. */
function isAdmin(role) {
    return role === 'SUPER_ADMIN';
}
/** Roles that can read audit logs. */
function canReadAudit(role) {
    return role === 'SUPER_ADMIN' || role === 'AUDITOR';
}
/** State-wide read (no row filter). */
function isStateScope(role) {
    return role === 'SUPER_ADMIN' || role === 'SCRB_ANALYST';
}
/** Default landing route per role (FRONTEND_ARCHITECTURE.md #3). */
function defaultHome(role) {
    switch (role) {
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
/** Whether a role may access a given route (UI guard; server enforces separately). */
function canAccessRoute(route, role) {
    if (route === '/login' || route === '/' || route === '/forbidden')
        return true;
    if (route === '/hub')
        return role === 'SUPER_ADMIN' || role === 'SCRB_ANALYST' || role === 'VIEWER';
    if (route === '/district')
        return (role === 'DISTRICT_COMMAND' ||
            role === 'SCRB_ANALYST' ||
            role === 'SUPER_ADMIN');
    if (route === '/station')
        return (role === 'SHO' ||
            role === 'DATA_OPERATOR' ||
            role === 'IO' ||
            role === 'SCRB_ANALYST' ||
            role === 'SUPER_ADMIN');
    if (route === '/cases')
        return true;
    if (route === '/network')
        return (role === 'SUPER_ADMIN' ||
            role === 'SCRB_ANALYST' ||
            role === 'DISTRICT_COMMAND' ||
            role === 'SHO' ||
            role === 'IO');
    if (route === '/predict')
        return (role === 'SUPER_ADMIN' ||
            role === 'SCRB_ANALYST' ||
            role === 'DISTRICT_COMMAND');
    if (route === '/reports')
        return canExport(role, EXPORT_DEFAULTS);
    if (route === '/admin')
        return isAdmin(role);
    if (route === '/audit')
        return canReadAudit(role);
    return false;
}
const EXPORT_DEFAULTS = ['SUPER_ADMIN', 'SCRB_ANALYST', 'DISTRICT_COMMAND'];
//# sourceMappingURL=rbac.js.map