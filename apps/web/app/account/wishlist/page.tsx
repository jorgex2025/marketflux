'use client';

import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/solid';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCart } from '@/hooks/use-cart';
import { useCartStore } from '@/src/store/cart.store';
import { useToast } from '@/components/providers/toast-provider';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCart();
  const setOpen = useCartStore((s) => s.setOpen);
  const { toast } = useToast();

   const handleAddToCart = async (item: typeof items[0]) => {
     try {
       await addItem(item.id, 1);
       toast(`¡${item.name} agregado al carrito!`, 'success');
       setOpen(true);
     } catch {
       toast('Error al agregar al carrito', 'error');
     }
   };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <HeartIcon className="h-7 w-7 text-red-500" />
        <h1 className="text-2xl font-bold">Mis Favoritos</h1>
        <span className="text-gray-400 text-sm">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <HeartIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-4">Tu lista de favoritos está vacía</p>
          <Link href="/shop/search" className="text-indigo-600 hover:underline text-sm">Explorar productos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border rounded-2xl overflow-hidden group">
              <Link href={`/shop/products/${item.slug}`}>
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                </div>
              </Link>
              <div className="p-4 space-y-3">
                <Link href={`/shop/products/${item.slug}`}>
                  <p className="font-medium text-sm line-clamp-2 hover:text-indigo-600">{item.name}</p>
                </Link>
                <p className="text-indigo-600 font-bold">${Number(item.price).toLocaleString('es-CO')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Agregar al carrito
                  </button>
                  <button
                    onClick={() => { removeItem(item.id); toast('Eliminado de favoritos', 'info'); }}
                    className="p-2 text-red-400 hover:text-red-600 border rounded-lg"
                    aria-label="Eliminar de favoritos"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
