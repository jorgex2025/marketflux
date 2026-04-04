'use client';

import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/hooks/use-cart';
import { useCartStore, selectCartTotal } from '@/store/cart.store';
import { useToast } from '@/components/providers/toast-provider';
import { useEffect } from 'react';

export default function CartPage() {
  const { items, fetchCart, removeItem, updateItem, applyCoupon, removeCoupon } = useCart();
  const total = useCartStore(selectCartTotal);
  const cart = useCartStore((s) => s);
  const { toast } = useToast();

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleRemove = async (id: string) => {
    try { await removeItem(id); } catch { toast('Error al eliminar', 'error'); }
  };

  const handleQty = async (id: string, qty: number) => {
    if (qty < 1) return;
    try { await updateItem(id, qty); } catch { toast('Error al actualizar', 'error'); }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-400 mb-6">Aúde productos para continuar</p>
        <Link href="/shop/search" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">Explorar tienda</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Carrito de compras</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border rounded-xl p-4">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-indigo-600 font-bold mt-1">${Number(item.unitPrice).toLocaleString('es-CO')}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => handleQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 border rounded-full text-sm disabled:opacity-40">−</button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => handleQty(item.id, item.quantity + 1)} className="w-8 h-8 border rounded-full text-sm">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                <p className="font-bold">${(Number(item.unitPrice) * item.quantity).toLocaleString('es-CO')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <div className="border rounded-xl p-5 space-y-3">
            <h2 className="font-bold">Resumen</h2>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            {cart.coupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Cupón ({cart.coupon.code})</span>
                <span>-{cart.coupon.discountType === 'percentage' ? `${cart.coupon.discountValue}%` : `$${cart.coupon.discountValue}`}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            <Link href="/checkout" className="block w-full bg-indigo-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">Ir a pagar</Link>
          </div>
          <Link href="/shop/search" className="block text-center text-sm text-gray-400 hover:text-gray-600">← Seguir comprando</Link>
        </div>
      </div>
    </div>
  );
}
