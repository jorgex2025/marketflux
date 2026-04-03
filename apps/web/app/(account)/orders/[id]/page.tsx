'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/providers/toast-provider';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', processing: 'Procesando',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') toast('¡Pago exitoso! Tu orden está siendo procesada.', 'success');
    if (searchParams.get('payment') === 'cancelled') toast('Pago cancelado. Tu carrito sigue guardado.', 'info');
  }, [searchParams, toast]);

  useEffect(() => {
    fetch(`/api/proxy/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.data ?? d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta orden?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/proxy/orders/${id}/cancel`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      setOrder((o: any) => ({ ...o, status: 'cancelled' }));
      toast('Orden cancelada', 'success');
    } catch {
      toast('No se pudo cancelar la orden', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-gray-200 rounded-xl" /><div className="h-40 bg-gray-100 rounded-xl" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-400"><p>Orden no encontrada</p><Link href="/account/orders" className="text-indigo-600 hover:underline text-sm mt-2 block">Volver a mis pedidos</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orden #{order.id?.slice(0, 8)}…</h1>
          <p className="text-sm text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[order.status] ?? order.status}</span>
      </div>

      {/* Items */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</div>
        <div className="divide-y">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              {item.product?.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-gray-400 mt-0.5">x{item.quantity} · ${Number(item.unitPrice).toLocaleString('es-CO')} c/u</p>
              </div>
              <p className="font-bold text-sm">${(Number(item.unitPrice) * item.quantity).toLocaleString('es-CO')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="border rounded-xl px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>${Number(order.subtotal ?? 0).toLocaleString('es-CO')}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Descuento</span><span>-${Number(order.discount).toLocaleString('es-CO')}</span></div>}
        {order.shippingCost > 0 && <div className="flex justify-between text-sm"><span>Envío</span><span>${Number(order.shippingCost).toLocaleString('es-CO')}</span></div>}
        <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${Number(order.total ?? 0).toLocaleString('es-CO')}</span></div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <Link href="/account/orders" className="text-sm text-gray-500 hover:text-gray-700">← Volver a pedidos</Link>
        {order.status === 'pending' && (
          <button onClick={handleCancel} disabled={cancelling} className="ml-auto text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
            {cancelling ? 'Cancelando...' : 'Cancelar orden'}
          </button>
        )}
        {order.status === 'delivered' && (
          <Link href={`/shop/products/${order.items?.[0]?.product?.slug}#reviews`} className="ml-auto text-sm text-indigo-600 hover:underline">Dejar reseña</Link>
        )}
      </div>
    </div>
  );
}
