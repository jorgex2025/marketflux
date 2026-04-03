import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Rutas que requieren autenticación (cualquier rol)
const AUTH_ROUTES = [
  '/account',
  '/checkout',
  '/orders',
];

// Rutas que requieren rol seller o admin
const VENDOR_ROUTES = ['/vendor'];

// Rutas que requieren rol admin
const ADMIN_ROUTES = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Leer sesión de Better Auth desde cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ??
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  const isAuthenticated = Boolean(sessionToken);

  // Rutas admin: solo admins (verificación de rol se hace en el layout con useAuth)
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (isAdminRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Rutas vendor
  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r));
  if (isVendorRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Rutas auth general
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/vendor/:path*',
    '/admin/:path*',
    '/checkout',
    '/orders/:path*',
  ],
};
