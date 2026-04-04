'use client';

import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useWishlistStore } from '@/store/wishlist.store';
import { useToast } from '@/components/providers/toast-provider';

interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

export function AddToWishlistButton({ product }: { product: WishlistItem }) {
  const { toggle, hasItem } = useWishlistStore();
  const { toast } = useToast();
  const isWishlisted = hasItem(product.id);

  const handleToggle = () => {
    toggle(product);
    toast(
      isWishlisted ? 'Eliminado de favoritos' : '¡Guardado en favoritos!',
      isWishlisted ? 'info' : 'success'
    );
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center hover:border-red-400 transition flex-shrink-0"
    >
      {isWishlisted ? (
        <HeartSolidIcon className="h-6 w-6 text-red-500" />
      ) : (
        <HeartIcon className="h-6 w-6 text-gray-400" />
      )}
    </button>
  );
}
