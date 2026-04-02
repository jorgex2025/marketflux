'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  sellerReply: string | null;
  createdAt: string;
}

export default function VendorReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/vendor/me`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((res) => setReviews(res.data ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  const handleReply = async (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply?.trim()) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reply }),
    });
    setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
  };

  if (loading) return <div className="p-8">Cargando reseñas...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Reseñas de mis productos</h1>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No tienes reseñas aún.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{review.title}</span>
                <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mb-3">{review.body}</p>
              {review.sellerReply ? (
                <div className="bg-muted rounded p-3 text-sm">
                  <span className="font-semibold">Tu respuesta: </span>
                  {review.sellerReply}
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 border rounded px-3 py-1 text-sm"
                    placeholder="Responder reseña..."
                    value={replyText[review.id] ?? ''}
                    onChange={(e) =>
                      setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                  />
                  <button
                    className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
                    onClick={() => handleReply(review.id)}
                  >
                    Responder
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
