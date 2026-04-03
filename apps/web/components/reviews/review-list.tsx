'use client';

import { useEffect, useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  user?: { name: string };
  helpfulCount?: number;
  sellerReply?: { body: string; createdAt: string };
}

interface ReviewListProps {
  productId: string;
}

export function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/reviews/product/${productId}?page=${page}&limit=${PER_PAGE}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.data ?? []);
        setTotal(d.meta?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return <p className="text-gray-400 text-sm">No hay reseñas aún. ¡Sé el primero!</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{total} reseña{total !== 1 ? 's' : ''}</p>
      {reviews.map((r) => (
        <div key={r.id} className="border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Stars rating={r.rating} />
            <span className="text-sm font-medium">{r.user?.name ?? 'Usuario'}</span>
            <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString('es-CO')}</span>
          </div>
          {r.title && <p className="font-semibold text-sm">{r.title}</p>}
          <p className="text-sm text-gray-700">{r.body}</p>
          {r.helpfulCount !== undefined && r.helpfulCount > 0 && (
            <p className="text-xs text-gray-400 flex items-center gap-1"><HandThumbUpIcon className="h-3.5 w-3.5" />{r.helpfulCount} útil</p>
          )}
          {r.sellerReply && (
            <div className="bg-gray-50 rounded-lg p-3 mt-2 border-l-4 border-indigo-400">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Respuesta del vendedor</p>
              <p className="text-sm text-gray-600">{r.sellerReply.body}</p>
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
          <span className="text-sm self-center">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <StarIcon key={s} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarOutlineIcon key={s} className="h-4 w-4 text-gray-300" />
        )
      )}
    </div>
  );
}
