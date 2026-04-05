'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Usuarios — Admin | MarketFlux',
  description: 'Gestiona los usuarios y sus roles en la plataforma.',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', seller: 'Vendedor', buyer: 'Comprador' };
const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  seller: 'bg-indigo-100 text-indigo-700',
  buyer: 'bg-green-100 text-green-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();
  const PER_PAGE = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('q', search);
    fetch(`${API}/users?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => { setUsers(res.data ?? []); setTotal(res.meta?.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, roleFilter]);

  const updateRole = async (user: User, role: User['role']) => {
    try {
      const res = await fetch(`${API}/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setUsers((u) => u.map((x) => x.id === user.id ? { ...x, role } : x));
      toast('Rol actualizado', 'success');
    } catch {
      toast('Error al actualizar rol', 'error');
    }
  };

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Usuarios</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona los usuarios y sus roles en la plataforma.</p>
      </div>

      <div className="flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Todos' }, { key: 'admin', label: 'Admins' }, { key: 'seller', label: 'Vendedores' }, { key: 'buyer', label: 'Compradores' }].map((f) => (
            <button key={f.key} onClick={() => { setRoleFilter(f.key); setPage(1); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${roleFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No se encontraron usuarios.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Nombre', 'Email', 'Rol', 'Fecha', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${ROLE_STYLES[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => updateRole(u, e.target.value as User['role'])} className="border border-zinc-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="buyer">Comprador</option>
                      <option value="seller">Vendedor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center p-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
