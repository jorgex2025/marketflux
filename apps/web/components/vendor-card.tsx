import Link from 'next/link';
import Image from 'next/image';
import type { Store } from '@/lib/api-client';

export function VendorCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-md transition-shadow"
    >
      {store.logoUrl ? (
        <Image
          src={store.logoUrl}
          alt={store.name}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
          {store.name[0]?.toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold truncate">{store.name}</p>
        {store.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{store.description}</p>
        )}
      </div>
    </Link>
  );
}
