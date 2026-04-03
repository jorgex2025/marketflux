'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/providers/toast-provider';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Error al actualizar perfil');
      toast('Perfil actualizado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Mi Perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <span className="inline-block text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full capitalize">{user?.role}</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
