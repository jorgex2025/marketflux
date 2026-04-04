'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/hooks/use-auth';
import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef } from 'react';

export function MainNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const { user, isAuthenticated, signOut } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Animate logo on hover
    const logo = logoRef.current;
    if (logo) {
      logo.addEventListener('mouseenter', () => {
        gsap.to(logo, { scale: 1.05, duration: 0.3, ease: "power2.out" });
      });
      logo.addEventListener('mouseleave', () => {
        gsap.to(logo, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    }

    // Animate cart icon bounce when items change
    const cartIcon = nav.querySelector('.cart-icon');
    if (cartIcon && cartCount > 0) {
      gsap.fromTo(cartIcon,
        { scale: 1.3, rotation: 10 },
        { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" }
      );
    }

    // Animate nav links on hover
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, { y: -2, duration: 0.2, ease: "power2.out" });
      });
      link.addEventListener('mouseleave', () => {
        gsap.to(link, { y: 0, duration: 0.2, ease: "power2.out" });
      });
    });
  }, { scope: navRef, dependencies: [cartCount] });

  return (
    <header ref={navRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link ref={logoRef} href="/" className="font-bold text-xl text-indigo-600 transition-transform duration-300">
          MarketFlux
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link
            href="/shop/search"
            className={`nav-link transition-colors duration-200 ${pathname.startsWith('/shop') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Tienda
          </Link>
          {isAuthenticated && user?.role === 'seller' && (
            <Link
              href="/vendor/dashboard"
              className={`nav-link transition-colors duration-200 ${pathname.startsWith('/vendor') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Mi tienda
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className={`nav-link transition-colors duration-200 ${pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && <NotificationBell />}
          <Link href="/cart" className="relative p-2 group">
            <ShoppingCartIcon className="cart-icon h-6 w-6 text-gray-700 group-hover:text-indigo-600 transition-colors duration-200" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/account/profile"
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                {user?.name?.split(' ')[0]}
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
