'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { usePlatformConfig } from '@/hooks/use-platform-config';
import type { PlatformConfig } from '@/lib/types/analytics';

export function ConfigClient() {
  const { data: session } = useSession();
  const token = (session as { token?: string })?.token ?? '';

  const { data: configs, isLoading, updateConfig, isUpdating } = usePlatformConfig(token);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(config: PlatformConfig) {
    setEditingKey(config.key);
    setEditValue(config.value);
  }

  function saveEdit(key: string) {
    updateConfig({ key, value: editValue });
    setEditingKey(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(configs ?? []).map((config) => (
        <div
          key={config.key}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300">{config.key}</p>
            {config.description && (
              <p className="mt-0.5 text-xs text-zinc-400">{config.description}</p>
            )}
            {editingKey === config.key ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 rounded border border-zinc-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
                <button
                  onClick={() => saveEdit(config.key)}
                  disabled={isUpdating}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingKey(null)}
                  className="rounded px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">{config.value}</p>
            )}
          </div>
          {editingKey !== config.key && (
            <button
              onClick={() => startEdit(config)}
              className="ml-4 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              Editar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
