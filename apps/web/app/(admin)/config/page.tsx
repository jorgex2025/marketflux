import { Suspense } from 'react';
import { ConfigClient } from './_components/config-client';

export const metadata = { title: 'Configuración — Admin | MarketFlux' };

export default function AdminConfigPage() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración de Plataforma</h1>
      <p className="mb-6 text-sm text-zinc-500">Ajusta los parámetros globales del marketplace.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />}>
        <ConfigClient />
      </Suspense>
    </main>
  );
}
