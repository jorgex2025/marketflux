'use client';

import Link from 'next/link';
import { useCart } from '../../../hooks/use-cart';

export default function CheckoutPage() {
  const { items, subtotal, total, coupon } = useCart();

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <section className="rounded border p-4 mb-6">
        <h2 className="mb-3 font-semibold">Resumen del pedido</h2>
        <ul className="divide-y text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({coupon.code})</span>
              <span>−${coupon.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Placeholder — Fase 5 conectará Stripe */}
      <div className="rounded border border-dashed border-indigo-300 bg-indigo-50 p-6 text-center">
        <p className="text-sm text-indigo-600">
          💳 Integración de pagos disponible en la <strong>Fase 5</strong>.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Aquí se renderizará el formulario de Stripe.
        </p>
      </div>

      <Link
        href="/cart"
        className="mt-6 block text-center text-sm text-indigo-600 hover:underline"
      >
        ← Volver al carrito
      </Link>
    </main>
  );
}
