'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [gmv, setGmv] = useState<any[]>([]);
  const [topStores, setTopStores] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/proxy/analytics/admin/summary').then((r) => r.json()).then((d) => setSummary(d.data ?? d)),
      fetch('/api/proxy/analytics/admin/gmv-by-day?days=30').then((r) => r.json()).then((d) => setGmv(d.data ?? [])),
      fetch('/api/proxy/analytics/admin/top-stores').then((r) => r.json()).then((d) => setTopStores(d.data ?? [])),
      fetch('/api/proxy/analytics/admin/order-status').then((r) => r.json()).then((d) => setOrderStatus(d.data ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = summary ? [
    { label: 'GMV total', value: `$${Number(summary.gmvTotal ?? 0).toLocaleString('es-CO')}`, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'GMV 30d', value: `$${Number(summary.gmv30d ?? 0).toLocaleString('es-CO')}`, color: 'bg-blue-50 text-blue-700' },
    { label: 'Usuarios', value: String(summary.totalUsers ?? 0), color: 'bg-purple-50 text-purple-700' },
    { label: 'Vendedores', value: String(summary.totalSellers ?? 0), color: 'bg-green-50 text-green-700' },
    { label: 'Órdenes totales', value: String(summary.totalOrders ?? 0), color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Productos activos', value: String(summary.totalProducts ?? 0), color: 'bg-red-50 text-red-700' },
  ] : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      {loading ? <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`rounded-xl p-5 ${k.color}`}>
              <p className="text-xs font-medium opacity-70">{k.label}</p>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      )}
      {gmv.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold mb-4">GMV últimos 30 días</h2>
          <div className="flex items-end gap-1 h-32">
            {gmv.map((r: any, i: number) => {
              const max = Math.max(...gmv.map((x: any) => Number(x.gmv ?? 0)));
              const h = max > 0 ? (Number(r.gmv) / max) * 100 : 0;
              return <div key={i} className="flex-1 bg-indigo-500 rounded-t opacity-80" style={{ height: `${h}%` }} title={`$${Number(r.gmv).toLocaleString('es-CO')}`} />;
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topStores.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-semibold mb-4">Top tiendas</h2>
            <div className="space-y-2">
              {topStores.slice(0, 5).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                  <p className="flex-1 text-sm font-medium truncate">{s.name}</p>
                  <p className="text-sm font-bold text-indigo-600">${Number(s.revenue ?? 0).toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {orderStatus.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-semibold mb-4">Estado de órdenes</h2>
            <div className="space-y-2">
              {orderStatus.map((s: any) => (
                <div key={s.status} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-600">{s.status}</span>
                  <span className="font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
