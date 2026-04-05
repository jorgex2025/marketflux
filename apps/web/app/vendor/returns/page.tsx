'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function VendorReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/returns?role=seller&limit=50')
      .then((r) => r.json())
      .then((d) => setReturns(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/proxy/returns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReturns((r) => r.map((x) => x.id === id ? { ...x, status } : x));
      toast('Estado de devolución actualizado', 'success');
    } catch { toast('Error al actualizar estado', 'error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de devoluciones</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : returns.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          <p className="text-lg font-medium">No hay devoluciones pendientes</p>
          <p className="text-sm mt-1">Las solicitudes de devolución aparecerán aquí</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Devolución', 'Producto', 'Motivo', 'Estado', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{r.product?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate">{r.reason ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {r.status === 'requested' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(r.id, 'approved')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">Aprobar</button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">Rechazar</button>
                      </div>
                    )}
                    {r.status === 'approved' && <button onClick={() => updateStatus(r.id, 'in_transit')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">Marcar en tránsito</button>}
                    {r.status === 'in_transit' && <button onClick={() => updateStatus(r.id, 'completed')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">Marcar completada</button>}
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
