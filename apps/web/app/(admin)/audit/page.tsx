import { Suspense } from 'react';
import { AuditPageClient } from './_components/audit-page-client';

export const metadata = { title: 'Audit Logs — Admin | MarketFlux' };

export default function AdminAuditPage() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Audit Logs</h1>
      <p className="mb-6 text-sm text-zinc-500">Registro completo de acciones en la plataforma.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />}>
        <AuditPageClient />
      </Suspense>
    </main>
  );
}
