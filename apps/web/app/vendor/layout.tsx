import Link from 'next/link';
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  StarIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const NAV = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { href: '/vendor/products', label: 'Productos', icon: CubeIcon },
  { href: '/vendor/orders', label: 'Pedidos', icon: ShoppingBagIcon },
  { href: '/vendor/shipping', label: 'Envíos', icon: TruckIcon },
  { href: '/vendor/returns', label: 'Devoluciones', icon: ArrowUturnLeftIcon },
  { href: '/vendor/reviews', label: 'Reseñas', icon: StarIcon },
  { href: '/vendor/coupons', label: 'Cupones', icon: TagIcon },
  { href: '/vendor/payouts', label: 'Pagos', icon: CurrencyDollarIcon },
  { href: '/vendor/chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
  { href: '/vendor/store', label: 'Mi tienda', icon: BuildingStorefrontIcon },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <p className="font-bold text-indigo-400">MarketFlux</p>
          <p className="text-xs text-gray-400 mt-0.5">Panel vendedor</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300">← Volver a la tienda</Link>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
