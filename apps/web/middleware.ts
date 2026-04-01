import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// TODO: Fase 2 — proteger rutas (account), (vendor), (admin), checkout, orders
export function middleware(_request: NextRequest) {
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
