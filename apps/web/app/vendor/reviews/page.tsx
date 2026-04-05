'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/reviews?role=seller&limit=50')
      .then((r) => r.json())
      .then((d) => setReviews(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const replyToReview = async (id: string, reply: string) => {
    try {
      const res = await fetch(`/api/proxy/reviews/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      if (!res.ok) throw new Error();
      setReviews((r) => r.map((x) => x.id === id ? { ...x, reply, replyDate: new Date().toISOString() } : x));
      toast('Respuesta publicada', 'success');
    } catch { toast('Error al responder', 'error'); }
  };

  const renderStars = (rating: number) => (
    <span className="text-yellow-500">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de reseñas</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div> : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          <p className="text-lg font-medium">No hay reseñas aún</p>
          <p className="text-sm mt-1">Las reseñas de tus productos aparecerán aquí</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Producto', 'Autor', 'Calificación', 'Comentario', 'Respuesta', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.product?.name ?? '—'}</td>
                  <td className="px-4 py-3">{r.author?.name ?? '—'}</td>
                  <td className="px-4 py-3">{renderStars(r.rating ?? 0)}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate">{r.comment ?? '—'}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate">{r.reply ?? <span className="text-gray-400">Sin respuesta</span>}</td>
                  <td className="px-4 py-3">
                    {!r.reply ? (
                      <button
                        onClick={() => {
                          const reply = prompt('Escribe tu respuesta:');
                          if (reply?.trim()) replyToReview(r.id, reply.trim());
                        }}
                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200"
                      >
                        Responder
                      </button>
                    ) : (
                      <span className="text-xs text-green-600">Respondida</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
