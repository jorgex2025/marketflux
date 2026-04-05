'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface KPI { label: string; value: string; sub?: string; color: string; }

export const metadata: Metadata = {
  title: 'Dashboard Vendedor — MarketFlux',
  description: 'Panel de control para vendedores del marketplace.',
};

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/stores/mine')
      .then((r) => r.json())
      .then((d) => { const s = d.data ?? d; setStoreId(s?.id ?? null); return s?.id; })
      .then((id) => {
        if (!id) return;
        return Promise.all([
          fetch(`/api/proxy/analytics/seller/${id}/summary`).then((r) => r.json()).then((d) => setSummary(d.data ?? d)),
          fetch(`/api/proxy/analytics/seller/${id}/revenue-by-day?days=30`).then((r) => r.json()).then((d) => setRevenue(d.data ?? [])),
          fetch(`/api/proxy/analytics/seller/${id}/top-products`).then((r) => r.json()).then((d) => setTopProducts(d.data ?? [])),
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis: KPI[] = summary ? [
    { label: 'GMV 30d', value: `$${Number(summary.gmv30d ?? 0).toLocaleString('es-CO')}`, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Órdenes', value: String(summary.orders30d ?? 0), sub: 'mes actual', color: 'bg-blue-50 text-blue-700' },
    { label: 'Ticket promedio', value: `$${Number(summary.avgTicket ?? 0).toLocaleString('es-CO')}`, color: 'bg-purple-50 text-purple-700' },
    { label: 'Reseñas promedio', value: `${Number(summary.avgRating ?? 0).toFixed(1)} ★`, color: 'bg-yellow-50 text-yellow-700' },
  ] : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`rounded-xl p-5 ${k.color}`}>
              <p className="text-xs font-medium opacity-70">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
              {k.sub && <p className="text-xs opacity-60 mt-0.5">{k.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart simple */}
      {revenue.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold mb-4">Ingresos últiimos 30 días</h2>
          <div className="flex items-end gap-1 h-32">
            {revenue.map((r: any, i: number) => {
              const max = Math.max(...revenue.map((x: any) => Number(x.revenue ?? 0)));
              const h = max > 0 ? (Number(r.revenue) / max) * 100 : 0;
              return <div key={i} className="flex-1 bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition" style={{ height: `${h}%` }} title={`$${Number(r.revenue).toLocaleString('es-CO')}`} />;
            })}
          </div>
        </div>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold mb-4">Top productos</h2>
          <div className="space-y-2">
            {topProducts.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                <p className="flex-1 text-sm font-medium truncate">{p.name}</p>
                <p className="text-sm font-bold text-indigo-600">${Number(p.revenue ?? 0).toLocaleString('es-CO')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
