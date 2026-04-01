'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  name: string;
  price: string | null;
  stock: number;
  active: boolean;
  imageUrl: string | null;
}

interface ProductVariantPickerProps {
  variants: Variant[];
  onChange?: (variant: Variant) => void;
}

export function ProductVariantPicker({ variants, onChange }: ProductVariantPickerProps) {
  const [selected, setSelected] = useState<string | null>(variants[0]?.id ?? null);

  const active = variants.filter((v) => v.active && v.stock > 0);

  function handleSelect(variant: Variant) {
    setSelected(variant.id);
    onChange?.(variant);
  }

  if (!variants.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          disabled={!v.active || v.stock === 0}
          onClick={() => handleSelect(v)}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm transition-colors',
            selected === v.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary',
            (!v.active || v.stock === 0) && 'opacity-40 cursor-not-allowed',
          )}
        >
          {v.name}
          {v.stock === 0 && ' (agotado)'}
        </button>
      ))}
    </div>
  );
}
