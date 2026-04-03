'use client';

import { useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/src/hooks/use-cart';
import { useCartStore } from '@/src/store/cart.store';
import { useToast } from '@/components/providers/toast-provider';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  className?: string;
}

export function AddToCartButton({ productId, name, price, imageUrl, stock, className = '' }: AddToCartButtonProps) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const setOpen = useCartStore((s) => s.setOpen);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (stock <= 0) return;
    setLoading(true);
    try {
      await addItem({ productId, quantity: qty });
      toast(`¡${name} agregado al carrito!`, 'success');
      setOpen(true);
    } catch (err: any) {
      toast(err?.message ?? 'Error al agregar al carrito', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold disabled:opacity-40 hover:bg-gray-100"
        >−</button>
        <span className="w-8 text-center font-medium">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(stock, q + 1))}
          disabled={qty >= stock}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-lg font-bold disabled:opacity-40 hover:bg-gray-100"
        >+</button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading || stock <= 0}
        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition w-full"
      >
        <ShoppingCartIcon className="h-5 w-5" />
        {loading ? 'Agregando...' : stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
