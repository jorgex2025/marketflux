import Link from 'next/link';
import Image from 'next/image';
import type { ProductDoc } from '@/lib/api-client';

interface ProductCardProps {
  product: ProductDoc;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? '/placeholder-product.png';
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
        {product.featured && (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            Destacado
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-semibold">
            Agotado
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">
            ${Number(product.price).toLocaleString('es-CO')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ${Number(product.comparePrice).toLocaleString('es-CO')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
