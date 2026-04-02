'use client';

import Link from 'next/link';
import { useCart } from '../hooks/use-cart';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, total, coupon, removeItem, updateQty } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel */}
      <aside className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Carrito ({items.length})</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {items.length === 0 && (
            <li className="text-center text-gray-500 py-10">El carrito está vacío</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded object-cover"
                />
              )}
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium line-clamp-2">{item.name}</span>
                <span className="text-sm text-gray-500">
                  ${item.price.toFixed(2)} × {item.qty}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => updateQty({ id: item.id, qty: item.qty - 1 })}
                    className="rounded border px-1 text-xs hover:bg-gray-100"
                    disabled={item.qty <= 1}
                  >
                    −
                  </button>
                  <span className="text-xs">{item.qty}</span>
                  <button
                    onClick={() => updateQty({ id: item.id, qty: item.qty + 1 })}
                    className="rounded border px-1 text-xs hover:bg-gray-100"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-auto text-xs text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t px-4 py-4 space-y-2">
          {coupon && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Cupón ({coupon.code})</span>
              <span>−${coupon.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            className="block w-full rounded bg-indigo-600 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            Ver carrito
          </Link>
          <Link
            href="/checkout"
            onClick={onClose}
            className="block w-full rounded border border-indigo-600 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Ir al checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
