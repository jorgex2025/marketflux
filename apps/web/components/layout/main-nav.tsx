'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useCartStore } from '@/src/store/cart.store';
import { useAuth } from '@/hooks/use-auth';

export function MainNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-xl text-indigo-600">MarketFlux</Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/shop/search" className={pathname.startsWith('/shop') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}>Tienda</Link>
          {isAuthenticated && user?.role === 'seller' && (
            <Link href="/vendor/dashboard" className={pathname.startsWith('/vendor') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}>Mi tienda</Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link href="/admin/dashboard" className={pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}>Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && <NotificationBell />}
          <Link href="/cart" className="relative p-2">
            <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/account/profile" className="text-sm text-gray-700">{user?.name?.split(' ')[0]}</Link>
              <button onClick={() => signOut()} className="text-sm text-red-500 hover:text-red-700">Salir</button>
            </div>
          ) : (
            <Link href="/login" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Ingresar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
