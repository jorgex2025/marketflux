'use client';

import { useEffect, useState } from 'react';

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/pending?limit=50`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((res) => setReviews(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    load();
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Moderación de Reseñas</h1>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No hay reseñas pendientes.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{review.title}</span>
                <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-auto">
                  {review.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{review.body}</p>
              <div className="flex gap-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                  onClick={() => moderate(review.id, 'approved')}
                >
                  ✓ Aprobar
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                  onClick={() => moderate(review.id, 'rejected')}
                >
                  ✗ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
