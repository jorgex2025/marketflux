'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '../../../hooks/use-cart';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    total,
    coupon,
    updateQty,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError('');
    applyCoupon(couponInput.trim(), {
      onError: (err: unknown) => {
        setCouponError(
          err instanceof Error ? err.message : 'Cupón no válido',
        );
      },
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Tu carrito</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">El carrito está vacío.</p>
      ) : (
        <>
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-20 w-20 rounded object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} c/u
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() =>
                        updateQty({ id: item.id, qty: item.qty - 1 })
                      }
                      className="rounded border px-2 py-0.5 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() =>
                        updateQty({ id: item.id, qty: item.qty + 1 })
                      }
                      className="rounded border px-2 py-0.5 hover:bg-gray-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto text-sm text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="text-right font-medium">
                  ${(item.price * item.qty).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>

          {/* Cupón */}
          <div className="mt-6 flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Código de cupón"
              className="flex-1 rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {coupon ? (
              <button
                onClick={() => removeCoupon()}
                className="rounded bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
              >
                Quitar cupón
              </button>
            ) : (
              <button
                onClick={handleApplyCoupon}
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Aplicar
              </button>
            )}
          </div>
          {couponError && (
            <p className="mt-1 text-sm text-red-500">{couponError}</p>
          )}
          {coupon && (
            <p className="mt-1 text-sm text-green-600">
              Cupón {coupon.code} aplicado: −${coupon.discountAmount.toFixed(2)}
            </p>
          )}

          {/* Totales */}
          <div className="mt-6 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>−${coupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="mt-6 w-full rounded bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Proceder al pago
          </button>
        </>
      )}
    </main>
  );
}
