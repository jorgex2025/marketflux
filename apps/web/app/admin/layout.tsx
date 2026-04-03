import Link from 'next/link';
import {
  ChartBarIcon, UsersIcon, CubeIcon, ShoppingBagIcon,
  Cog6ToothIcon, ClipboardDocumentListIcon, FlagIcon,
  BuildingStorefrontIcon, TagIcon,
} from '@heroicons/react/24/outline';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { href: '/admin/users', label: 'Usuarios', icon: UsersIcon },
  { href: '/admin/products', label: 'Productos', icon: CubeIcon },
  { href: '/admin/orders', label: 'Órdenes', icon: ShoppingBagIcon },
  { href: '/admin/stores', label: 'Tiendas', icon: BuildingStorefrontIcon },
  { href: '/admin/reviews', label: 'Reseñas', icon: FlagIcon },
  { href: '/admin/coupons', label: 'Cupones', icon: TagIcon },
  { href: '/admin/config', label: 'Configuración', icon: Cog6ToothIcon },
  { href: '/admin/audit', label: 'Auditoría', icon: ClipboardDocumentListIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-800">
          <p className="font-bold text-red-400">MarketFlux</p>
          <p className="text-xs text-slate-400 mt-0.5">Panel admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">← Volver a la tienda</Link>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
