'use client';

import { useState } from 'react';

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, rating, title, body }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Error al enviar reseña');
      }
      setTitle('');
      setBody('');
      setRating(5);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
      <h3 className="font-semibold">Escribir reseña</h3>
      <div>
        <label className="text-sm font-medium">Calificación</label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              className={`text-2xl ${s <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Título</label>
        <input
          className="w-full border rounded px-3 py-2 mt-1 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Reseña</label>
        <textarea
          className="w-full border rounded px-3 py-2 mt-1 text-sm"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  );
}
