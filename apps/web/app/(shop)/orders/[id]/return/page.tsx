'use client';

import type { Metadata } from 'next';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Solicitar devolución — MarketFlux',
  description: 'Solicita la devolución de un producto comprado.',
};

export const metadata: Metadata = {
  title: 'Solicitar devolución — MarketFlux',
  description: 'Solicita la devolución de un producto comprado.',
};
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ReturnPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: params.id,
          reason,
          description,
          items: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Error al solicitar devolución');
        return;
      }

      router.push('/orders');
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Devolución</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border rounded-xl px-4 py-3 text-sm"
            >
              <option value="">Seleccionar motivo</option>
              <option value="defective">Producto defectuoso</option>
              <option value="not_as_described">No coincide con la descripción</option>
              <option value="wrong_item">Producto incorrecto</option>
              <option value="missing_parts">Faltan piezas</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full border rounded-xl px-4 py-3 text-sm"
              placeholder="Describe el problema con detalle..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
