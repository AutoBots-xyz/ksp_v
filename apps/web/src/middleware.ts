import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths bypass auth checks
  const publicPaths = ['/login', '/forbidden', '/_next', '/api/v1/health', '/favicon.ico'];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Next.js middleware stub for route protection.
  // In production with Catalyst Auth SDK, session cookie is verified here.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
