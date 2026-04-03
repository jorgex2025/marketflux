'use client';

import type { AuditLog } from '@/lib/types/analytics';

interface AuditTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function AuditTable({
  logs,
  isLoading = false,
  page,
  total,
  limit,
  onPageChange,
}: AuditTableProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3 h-8 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Acción</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Recurso</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{log.userEmail}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {log.resource}{log.resourceId ? `/${log.resourceId}` : ''}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {new Date(log.createdAt).toLocaleString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <p className="text-xs text-zinc-400">
            {total} registros · Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ← Anterior
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
