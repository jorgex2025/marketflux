import { Suspense } from 'react';
import { SellerDashboardClient } from './_components/seller-dashboard-client';

export const metadata = { title: 'Dashboard — Vendor | MarketFlux' };

export default function VendorDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mi Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <SellerDashboardClient />
      </Suspense>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
