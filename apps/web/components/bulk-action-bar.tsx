'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string) => void;
  actions?: { label: string; key: string; variant?: 'primary' | 'danger' }[];
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onAction, onClear, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const defaultActions = [
    { label: 'Activar', key: 'activate', variant: 'primary' as const },
    { label: 'Desactivar', key: 'deactivate' },
    { label: 'Eliminar', key: 'delete', variant: 'danger' as const },
  ];

  const actionList = actions ?? defaultActions;
  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    default: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50',
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl border border-zinc-200 shadow-xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom">
      <span className="text-sm font-medium text-zinc-900">
        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold mr-2">{selectedCount}</span>
        seleccionado{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        {actionList.map((action) => (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${variantStyles[action.variant ?? 'default']}`}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="text-zinc-400 hover:text-zinc-600 ml-2">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
