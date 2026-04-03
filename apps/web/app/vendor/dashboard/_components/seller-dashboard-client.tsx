'use client';

import { useSession } from '@/lib/auth-client';
import { useSellerAnalytics } from '@/hooks/use-seller-analytics';
import { KpiCard } from '@/components/kpi-card';
import { RevenueChart } from '@/components/charts/revenue-chart';

export function SellerDashboardClient() {
  const { data: session } = useSession();
  const token = (session as { token?: string })?.token ?? '';
  const sellerId = session?.user?.id ?? '';

  const { data, isLoading, error } = useSellerAnalytics({ token, sellerId, days: 30 });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error cargando analytics: {(error as Error).message}
      </div>
    );
  }

  // Aggregate KPIs from daily data
  const totalRevenue = data?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalOrders = data?.reduce((sum, d) => sum + d.orders, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const activeDays = data?.filter((d) => d.orders > 0).length ?? 0;

  const formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title="Revenue (30d)"
          value={formatCOP(totalRevenue)}
          subtitle="Últimos 30 días"
          isLoading={isLoading}
        />
        <KpiCard
          title="Órdenes"
          value={totalOrders}
          subtitle="Últimos 30 días"
          isLoading={isLoading}
        />
        <KpiCard
          title="Ticket promedio"
          value={formatCOP(avgOrderValue)}
          isLoading={isLoading}
        />
        <KpiCard
          title="Días activos"
          value={`${activeDays} / 30`}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart data={data ?? []} isLoading={isLoading} />
    </div>
  );
}
