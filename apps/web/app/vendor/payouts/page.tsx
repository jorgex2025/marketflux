'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export const metadata: Metadata = {
  title: 'Mis pagos — Vendedor | MarketFlux',
  description: 'Consulta el historial de pagos y tu balance.',
};

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/proxy/payouts').then((r) => r.json()).then((d) => setPayouts(d.data ?? [])),
      fetch('/api/proxy/payouts/balance').then((r) => r.json()).then((d) => setBalance(d.data ?? d)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Mis pagos</h1>
      {balance && (
        <div className="grid grid-cols-3 gap-4">
          {[['Disponible', balance.available], ['Pendiente', balance.pending], ['Total pagado', balance.totalPaid]].map(([label, value]) => (
            <div key={label as string} className="bg-white border rounded-2xl p-5">
              <p className="text-xs text-gray-500">{label as string}</p>
              <p className="text-2xl font-bold mt-1">${Number(value ?? 0).toLocaleString('es-CO')}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? <div className="p-6"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div> : payouts.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">Sin pagos registrados</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Fecha', 'Monto', 'Método', 'Estado'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 font-bold">${Number(p.amount).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3">{p.method ?? 'Transferencia'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-500'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
