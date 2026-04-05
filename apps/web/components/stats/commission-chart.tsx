'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface CommissionChartProps {
  days?: number;
}

export function CommissionChart({ days = 30 }: CommissionChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/analytics/commissions?days=${days}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="h-48 bg-zinc-100 rounded-xl animate-pulse" />;
  if (data.length === 0) return <p className="text-center text-zinc-400 text-sm py-8">Sin datos de comisiones</p>;

  const max = Math.max(...data.map((d: any) => Number(d.amount ?? 0)));
  const total = data.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900">Comisiones últimos {days} días</h3>
        <span className="text-lg font-bold text-purple-600">${total.toLocaleString('es-CO')}</span>
      </div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d: any, i: number) => {
          const h = max > 0 ? (Number(d.amount ?? 0) / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                style={{ height: `${Math.max(h, 4)}%` }}
              />
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-zinc-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                ${Number(d.amount ?? 0).toLocaleString('es-CO')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-zinc-400">
        <span>{data[0]?.date ?? ''}</span>
        <span>{data[data.length - 1]?.date ?? ''}</span>
      </div>
    </div>
  );
}
