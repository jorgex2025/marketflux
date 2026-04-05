'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Mi perfil — MarketFlux',
  description: 'Edita la información de tu perfil.',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/api/auth/session`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.user) {
          setName(d.data.user.name ?? '');
          setEmail(d.data.user.email ?? '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        setMessage('Error al actualizar perfil');
        return;
      }

      setMessage('Perfil actualizado correctamente');
    } catch {
      setMessage('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              value={email}
              disabled
              className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </main>
  );
}
