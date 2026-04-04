'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCartStore, selectCartTotal, selectCartCount } from '@/store/cart.store';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/components/providers/toast-provider';
import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';

export function CartDrawer() {
  const { isOpen, setOpen, items } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const count = useCartStore(selectCartCount);
  const { removeItem, updateItem } = useCart();
  const { toast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const overlay = overlayRef.current;
    const drawer = drawerRef.current;
    const itemsContainer = itemsRef.current;

    if (!overlay || !drawer) return;

    if (isOpen) {
      // Animate overlay fade in
      gsap.fromTo(overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );

      // Animate drawer slide in
      gsap.fromTo(drawer,
        { x: '100%' },
        { x: '0%', duration: 0.4, ease: "power3.out" }
      );

      // Animate items stagger
      if (itemsContainer && items.length > 0) {
        const itemElements = itemsContainer.querySelectorAll('.cart-item');
        gsap.fromTo(itemElements,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2
          }
        );
      }
    }
  }, { dependencies: [isOpen, items.length] });

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch {
      toast('Error al eliminar el item', 'error');
    }
  };

  const handleQtyChange = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    try {
      await updateItem(itemId, qty);
    } catch {
      toast('Error al actualizar la cantidad', 'error');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Carrito ({count})</h2>
          <button onClick={() => setOpen(false)} aria-label="Cerrar carrito">
            <XMarkIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
          </button>
        </div>

        {/* Items */}
        <div ref={itemsRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <p className="text-4xl mb-4">🛒</p>
              <p>Tu carrito está vacío</p>
              <Link href="/shop/search" onClick={() => setOpen(false)} className="mt-4 inline-block text-indigo-600 hover:underline text-sm transition-colors duration-200">Explorar productos</Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item flex gap-4 items-start bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                  <p className="text-indigo-600 font-bold text-sm mt-1">${Number(item.unitPrice).toLocaleString('es-CO')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-sm disabled:opacity-40"
                    >−</button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-sm"
                    >+</button>
                  </div>
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 mt-1" aria-label="Eliminar">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full bg-indigo-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Ir a pagar
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
