'use client';

import Link from 'next/link';
import { StarIcon, MapPinIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface VendorCardProps {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  location?: string;
  active?: boolean;
}

export function VendorCard({
  id, name, slug, logoUrl, bannerUrl, description,
  rating = 0, reviewCount = 0, productCount = 0, location, active = true,
}: VendorCardProps) {
  return (
    <Link href={`/stores/${slug}`} className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {bannerUrl ? (
        <div className="h-24 bg-zinc-100 overflow-hidden">
          <img src={bannerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
      )}
      <div className="px-4 pb-4 -mt-8 relative">
        <div className="flex items-end gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="w-14 h-14 rounded-xl border-2 border-white object-cover shadow-sm bg-white" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm">{name[0]}</div>
          )}
          <div className="flex-1 min-w-0 pb-1">
            <h3 className="font-semibold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">{name}</h3>
            {location && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPinIcon className="h-3 w-3" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
          {!active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Inactiva</span>}
        </div>
        {description && (
          <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium text-zinc-700">{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>
            <span>{productCount} producto{productCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 text-xs font-medium">
            <ShoppingCartIcon className="h-3.5 w-3.5" />
            Ver tienda
          </div>
        </div>
      </div>
    </Link>
  );
}
