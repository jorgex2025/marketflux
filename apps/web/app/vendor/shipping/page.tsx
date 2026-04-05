'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', preparing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', in_transit: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

export default function VendorShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/shipments?role=seller&limit=50')
      .then((r) => r.json())
      .then((d) => setShipments(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/proxy/shipments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setShipments((s) => s.map((x) => x.id === id ? { ...x, status } : x));
      toast('Estado de envío actualizado', 'success');
    } catch { toast('Error al actualizar estado', 'error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de envíos</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : shipments.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          <p className="text-lg font-medium">No hay envíos pendientes</p>
          <p className="text-sm mt-1">Los envíos aparecerán aquí cuando se realicen pedidos</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Envío', 'Destinatario', 'Tracking', 'Estado', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{s.recipient ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.trackingNumber ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    {s.status === 'pending' && <button onClick={() => updateStatus(s.id, 'preparing')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">Preparar</button>}
                    {s.status === 'preparing' && <button onClick={() => updateStatus(s.id, 'shipped')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">Marcar enviado</button>}
                    {s.status === 'shipped' && <button onClick={() => updateStatus(s.id, 'in_transit')} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200">En tránsito</button>}
                    {s.status === 'in_transit' && <button onClick={() => updateStatus(s.id, 'delivered')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">Marcar entregado</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
