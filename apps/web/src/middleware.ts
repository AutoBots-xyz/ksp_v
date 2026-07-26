import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths bypass auth checks
  const publicPaths = ['/login', '/forbidden', '/_next', '/api/v1/health', '/favicon.ico'];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Catalyst Auth sets a session cookie (__zlb) when the user is authenticated.
  // Check for its presence as a client-side route guard (defense-in-depth).
  // The real authorization is enforced server-side in each Catalyst Function via requireAuth().
  // Reference: https://docs.catalyst.zoho.com/en/web-client-sdk/help/user-management/authentication/
  const catalystSession =
    request.cookies.get('__zlb') ??
    request.cookies.get('catalyst_session') ??
    request.cookies.get('IAMAuthCookie');

  // In local development or if a dev_session cookie is set, bypass Catalyst production auth guard
  const isDev = process.env.NODE_ENV === 'development' || request.cookies.has('dev_session');

  if (!catalystSession && !isDev) {
    // Not authenticated — redirect to login page preserving the intended destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
