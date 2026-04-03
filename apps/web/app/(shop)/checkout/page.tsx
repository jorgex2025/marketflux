'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type CartItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: string;
  images?: string[];
};

type Cart = {
  id: string;
  items: CartItem[];
  couponCode?: string;
  subtotal?: string;
  discount?: string;
  total?: string;
};

export default function CheckoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [cart,         setCart]         = useState<Cart | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [placing,      setPlacing]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [couponInput,  setCouponInput]  = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?from=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API}/api/cart`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { data: Cart }) => setCart(data.data))
      .catch(() => setError('No se pudo cargar el carrito'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  async function handlePlaceOrder() {
    if (!cart?.items?.length) return;
    setPlacing(true);
    setError(null);
    try {
      // 1. Crear orden
      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const orderJson = await orderRes.json() as { data?: { id: string }; error?: { message: string } };
      if (!orderRes.ok) throw new Error(orderJson.error?.message ?? 'Error al crear la orden');

      const orderId = orderJson.data!.id;

      // 2. Crear Stripe Checkout Session
      const sessionRes = await fetch(`${API}/api/payments/checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const sessionJson = await sessionRes.json() as { url?: string; error?: { message: string } };
      if (!sessionRes.ok) throw new Error(sessionJson.error?.message ?? 'Error al crear sesión de pago');

      // 3. Redirigir a Stripe
      if (sessionJson.url) window.location.href = sessionJson.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setPlacing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Tu carrito está vacío.</p>
        <a href="/shop/search" className="text-indigo-600 hover:underline">Ir a la tienda</a>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, i) => sum + parseFloat(i.unitPrice) * i.qty, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Confirmar pedido</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Items */}
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.productId} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.images?.[0] ?? `https://placehold.co/80x80/e0e7ff/6366f1?text=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Cantidad: {item.qty}</p>
                  <p className="text-indigo-600 font-bold">
                    ${(parseFloat(item.unitPrice) * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl p-6 shadow-sm h-fit space-y-4">
            <h2 className="font-semibold text-gray-900">Resumen</h2>

            {/* Cupón */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de cupón"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="text-sm text-indigo-600 font-medium hover:underline whitespace-nowrap">
                Aplicar
              </button>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {cart.discount && parseFloat(cart.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>-${parseFloat(cart.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                <span>Total</span>
                <span>${cart.total ? parseFloat(cart.total).toFixed(2) : subtotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold
                         hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {placing ? 'Procesando...' : 'Pagar con Stripe'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Pago seguro procesado por Stripe
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
