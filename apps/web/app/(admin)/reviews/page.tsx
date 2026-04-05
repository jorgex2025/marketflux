'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Reseñas — Admin | MarketFlux',
  description: 'Modera las reseñas del marketplace.',
};

interface Review {
  id: string;
  userName: string;
  productName: string;
  rating: number;
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { toast } = useToast();

  const load = () => {
    const url = filter === 'pending' ? `${API}/reviews/pending?limit=50` : `${API}/reviews?status=${filter}&limit=50`;
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setReviews(res.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${API}/reviews/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReviews((r) => r.filter((x) => x.id !== id));
      toast(`Reseña ${status === 'approved' ? 'aprobada' : 'rechazada'}`, 'success');
    } catch {
      toast('Error al moderar reseña', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reseñas</h1>
        <p className="text-sm text-zinc-500 mt-1">Modera las reseñas del marketplace.</p>
      </div>

      <div className="flex gap-2">
        {[{ key: 'pending', label: 'Pendientes' }, { key: 'approved', label: 'Aprobadas' }, { key: 'rejected', label: 'Rechazadas' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay reseñas pendientes de moderación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.title}</span>
                    <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : review.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{review.status}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-1">{review.userName} · {review.productName}</p>
                  <p className="text-sm text-zinc-600">{review.body}</p>
                  <p className="text-xs text-zinc-400 mt-2">{new Date(review.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
                {review.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => moderate(review.id, 'approved')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">Aprobar</button>
                    <button onClick={() => moderate(review.id, 'rejected')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">Rechazar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
