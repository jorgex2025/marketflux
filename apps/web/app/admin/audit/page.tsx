'use client';

import { useEffect, useState } from 'react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/proxy/audit?page=${page}&limit=${PER_PAGE}`).then((r) => r.json()).then((d) => { setLogs(d.data ?? []); setTotal(d.meta?.total ?? 0); }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const METHOD_STYLES: Record<string, string> = {
    POST: 'bg-green-100 text-green-700', PATCH: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700', PUT: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Log de auditoría</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />)}</div> : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Fecha', 'Usuario', 'Método', 'Entidad', 'ID', 'IP'].map((h) => <th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-400">{new Date(l.createdAt).toLocaleString('es-CO')}</td>
                  <td className="px-3 py-2.5">{l.user?.name ?? l.userId?.slice(0, 8)}</td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded font-bold ${METHOD_STYLES[l.action] ?? 'bg-gray-100 text-gray-500'}`}>{l.action}</span></td>
                  <td className="px-3 py-2.5 font-medium">{l.entity}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-400">{l.entityId?.slice(0, 8)}…</td>
                  <td className="px-3 py-2.5 text-gray-400">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center p-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
