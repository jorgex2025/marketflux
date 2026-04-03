'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { KpiCard } from '@/components/kpi-card';
import { AuditTable } from '@/components/tables/audit-table';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Hoy', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
];

export function AdminDashboardClient() {
  const { data: session } = useSession();
  const token = (session as { token?: string })?.token ?? '';

  const [period, setPeriod] = useState<Period>('month');
  const [auditPage, setAuditPage] = useState(1);

  const gmvQuery = useAdminAnalytics({ token, period });
  const auditQuery = useAuditLogs({ token, page: auditPage, limit: 20 });

  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const gmv = gmvQuery.data;

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              period === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* GMV KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title="GMV"
          value={gmv ? formatCOP(gmv.gmv) : '—'}
          subtitle={`Período: ${period}`}
          isLoading={gmvQuery.isLoading}
        />
        <KpiCard
          title="Órdenes totales"
          value={gmv?.totalOrders ?? '—'}
          isLoading={gmvQuery.isLoading}
        />
        <KpiCard
          title="Vendedores activos"
          value={gmv?.totalSellers ?? '—'}
          isLoading={gmvQuery.isLoading}
        />
        <KpiCard
          title="AOV"
          value={gmv ? formatCOP(gmv.averageOrderValue) : '—'}
          subtitle="Average Order Value"
          isLoading={gmvQuery.isLoading}
        />
      </div>

      {/* Audit logs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Audit Logs</h2>
        <AuditTable
          logs={auditQuery.data?.data ?? []}
          isLoading={auditQuery.isLoading}
          page={auditPage}
          total={auditQuery.data?.total ?? 0}
          limit={20}
          onPageChange={setAuditPage}
        />
      </section>
    </div>
  );
}
