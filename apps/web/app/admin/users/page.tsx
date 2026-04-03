'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const ROLE_STYLES: Record<string, string> = {
  buyer: 'bg-gray-100 text-gray-600', seller: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-red-100 text-red-700', superadmin: 'bg-red-200 text-red-800',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/users?limit=100').then((r) => r.json()).then((d) => setUsers(d.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/proxy/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setUsers((u) => u.map((x) => x.id === id ? { ...x, role } : x));
      toast('Rol actualizado', 'success');
    } catch { toast('Error al actualizar rol', 'error'); }
  };

  const filtered = users.filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios <span className="text-gray-400 text-lg">({users.length})</span></h1>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email…" className="w-full max-w-sm border rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      {loading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Usuario', 'Email', 'Rol', 'Registro', 'Cambiar rol'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-500'}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="text-xs border rounded-lg px-2 py-1">
                      {['buyer', 'seller', 'admin', 'superadmin'].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
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
