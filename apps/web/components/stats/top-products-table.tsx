'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface TopProductsTableProps {
  storeId?: string;
  limit?: number;
}

export function TopProductsTable({ storeId, limit = 10 }: TopProductsTableProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    fetch(`${API}/analytics/seller/${storeId}/top-products?limit=${limit}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setProducts(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId, limit]);

  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />)}</div>;
  if (products.length === 0) return <p className="text-center text-zinc-400 text-sm py-8">Sin datos de productos</p>;

  const maxRevenue = Math.max(...products.map((p: any) => Number(p.revenue ?? 0)));

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <h3 className="font-semibold text-zinc-900 mb-4">Top productos</h3>
      <div className="space-y-3">
        {products.slice(0, limit).map((p: any, i: number) => {
          const barWidth = maxRevenue > 0 ? (Number(p.revenue ?? 0) / maxRevenue) * 100 : 0;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 w-5 text-right font-medium">{i + 1}</span>
              {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-sm font-bold text-indigo-600 ml-2">${Number(p.revenue ?? 0).toLocaleString('es-CO')}</p>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
