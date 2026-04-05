'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Variant {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
  image?: string;
}

interface VariantGroup {
  id: string;
  label: string;
  options: Variant[];
}

interface ProductVariantPickerProps {
  variants: VariantGroup[];
  onSelect?: (selection: Record<string, string>) => void;
}

export function ProductVariantPicker({ variants, onSelect }: ProductVariantPickerProps) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const handleSelect = (groupId: string, variantId: string) => {
    const newSelection = { ...selection, [groupId]: variantId };
    setSelection(newSelection);
    onSelect?.(newSelection);
  };

  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {variants.map((group) => (
        <div key={group.id}>
          <label className="text-sm font-medium text-zinc-700 mb-2 block">{group.label}</label>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isSelected = selection[group.id] === option.id;
              const isDisabled = option.stock !== undefined && option.stock <= 0;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(group.id, option.id)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                      : isDisabled
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed line-through'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {option.value}
                  {option.price && option.price > 0 && (
                    <span className="ml-1 text-xs opacity-60">+${option.price.toLocaleString('es-CO')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
