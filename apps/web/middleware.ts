import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/account',
  '/vendor',
  '/admin',
  '/checkout',
  '/orders',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ??
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/(account)/:path*',
    '/(vendor)/:path*',
    '/(admin)/:path*',
    '/checkout',
    '/orders/:path*',
  ],
};
