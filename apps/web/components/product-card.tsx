'use client';

import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  vendorName?: string;
  vendorSlug?: string;
  status?: string;
  stock?: number;
  featured?: boolean;
}

export function ProductCard({
  id, name, slug, price, compareAtPrice, image,
  rating = 0, reviewCount = 0, vendorName, vendorSlug,
  stock, featured,
}: ProductCardProps) {
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${slug}`} className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square bg-zinc-100 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discount}%</span>
        )}
        {featured && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">★ Destacado</span>
        )}
        {stock !== undefined && stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-zinc-900 text-sm font-bold px-4 py-2 rounded-full">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">{name}</h3>
        {vendorName && vendorSlug && (
          <Link href={`/stores/${vendorSlug}`} onClick={(e) => e.stopPropagation()} className="text-xs text-zinc-400 hover:text-indigo-500 transition-colors">{vendorName}</Link>
        )}
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            i < Math.floor(rating)
              ? <StarIcon key={i} className="h-3.5 w-3.5 text-amber-400" />
              : <StarOutline key={i} className="h-3.5 w-3.5 text-zinc-300" />
          ))}
          {reviewCount > 0 && <span className="text-xs text-zinc-400 ml-1">({reviewCount})</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-zinc-900">${price.toLocaleString('es-CO')}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-zinc-400 line-through">${compareAtPrice.toLocaleString('es-CO')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
