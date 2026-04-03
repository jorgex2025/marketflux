'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { AuditTable } from '@/components/tables/audit-table';

const RESOURCE_FILTERS = [
  { label: 'Todos', value: undefined },
  { label: 'Usuarios', value: 'user' },
  { label: 'Productos', value: 'product' },
  { label: 'Ordenes', value: 'order' },
  { label: 'Config', value: 'config' },
];

export function AuditPageClient() {
  const { data: session } = useSession();
  const token = (session as { token?: string })?.token ?? '';

  const [page, setPage] = useState(1);
  const [resource, setResource] = useState<string | undefined>(undefined);

  const { data, isLoading } = useAuditLogs({ token, page, limit: 25, resource });

  return (
    <div className="space-y-4">
      {/* Resource filter */}
      <div className="flex flex-wrap gap-2">
        {RESOURCE_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => { setResource(f.value); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              resource === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AuditTable
        logs={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        total={data?.total ?? 0}
        limit={25}
        onPageChange={setPage}
      />
    </div>
  );
}
