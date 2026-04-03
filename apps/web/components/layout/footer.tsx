import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <p className="font-bold text-white mb-3">MarketFlux</p>
          <p className="text-sm">El marketplace que conecta compradores y vendedores.</p>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Comprar</p>
          <ul className="text-sm space-y-2">
            <li><Link href="/shop/search" className="hover:text-white">Explorar</Link></li>
            <li><Link href="/account/orders" className="hover:text-white">Mis órdenes</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Vender</p>
          <ul className="text-sm space-y-2">
            <li><Link href="/vendor/dashboard" className="hover:text-white">Dashboard</Link></li>
            <li><Link href="/vendor/products" className="hover:text-white">Mis productos</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Legal</p>
          <ul className="text-sm space-y-2">
            <li><Link href="/privacy" className="hover:text-white">Privacidad</Link></li>
            <li><Link href="/terms" className="hover:text-white">Términos</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs mt-10">&copy; {new Date().getFullYear()} MarketFlux. Todos los derechos reservados.</p>
    </footer>
  );
}
