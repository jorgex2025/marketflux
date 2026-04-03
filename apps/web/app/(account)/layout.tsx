import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  UserCircleIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const NAV = [
  { href: '/account/profile', label: 'Mi perfil', icon: UserCircleIcon },
  { href: '/account/orders', label: 'Mis pedidos', icon: ShoppingBagIcon },
  { href: '/account/wishlist', label: 'Favoritos', icon: HeartIcon },
  { href: '/account/addresses', label: 'Direcciones', icon: MapPinIcon },
  { href: '/account/settings', label: 'Configuración', icon: Cog6ToothIcon },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
