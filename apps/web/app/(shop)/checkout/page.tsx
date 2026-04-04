'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, selectCartTotal } from '@/store/cart.store';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/hooks/use-auth';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, clearCart } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?from=/checkout');
  }, [isAuthenticated, authLoading, router]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch('/api/proxy/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      if (!res.ok) throw new Error('Cupón inválido');
      toast('Cupón aplicado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setApplyingCoupon(false); }
  };

  const handleCheckout = async () => {
    if (items.length === 0) { toast('Tu carrito está vacío', 'error'); return; }
    setLoading(true);
    try {
      // 1. Crear orden
      const orderRes = await fetch('/api/proxy/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: coupon?.code }),
      });
      if (!orderRes.ok) throw new Error('Error al crear la orden');
      const { data: order } = await orderRes.json();

      // 2. Crear Stripe Checkout Session
      const sessionRes = await fetch('/api/proxy/payments/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          successUrl: `${window.location.origin}/account/orders/${order.id}?payment=success`,
          cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
        }),
      });
      if (!sessionRes.ok) throw new Error('Error al iniciar el pago');
      const { data: session } = await sessionRes.json();
      window.location.href = session.url;
    } catch (err: any) {
      toast(err.message, 'error');
      setLoading(false);
    }
  };

  if (authLoading || items.length === 0) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
    </div>
  );

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const discount = coupon ? (coupon.discountType === 'percentage' ? subtotal * coupon.discountValue / 100 : coupon.discountValue) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Finalizar compra</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-semibold">Tu pedido ({items.length} items)</h2>
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />}
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-gray-400">x{item.quantity}</p>
              </div>
              <p className="text-sm font-bold">${(item.unitPrice * item.quantity).toLocaleString('es-CO')}</p>
            </div>
          ))}
        </div>

        {/* Resumen + Pago */}
        <div className="space-y-4">
          {/* Cupón */}
          <div className="flex gap-2">
            <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Código de cupón" className="flex-1 border rounded-xl px-3 py-2 text-sm" />
            <button onClick={handleApplyCoupon} disabled={applyingCoupon} className="text-sm bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 disabled:opacity-50">{applyingCoupon ? '…' : 'Aplicar'}</button>
          </div>

          {/* Totales */}
          <div className="border rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Cupón ({coupon?.code})</span>
                <span>-${discount.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span><span>${(subtotal - discount).toLocaleString('es-CO')}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando…</> : '🔒 Pagar con Stripe'}
            </button>
            <p className="text-xs text-center text-gray-400">Pago seguro procesado por Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
