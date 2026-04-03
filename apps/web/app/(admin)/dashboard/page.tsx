import { Suspense } from 'react';
import { AdminDashboardClient } from './_components/admin-dashboard-client';

export const metadata = { title: 'Dashboard Admin | MarketFlux' };

export default function AdminDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Panel Administrador</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminDashboardClient />
      </Suspense>
    </main>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
