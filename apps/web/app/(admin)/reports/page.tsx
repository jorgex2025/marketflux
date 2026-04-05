'use client';

import { useEffect, useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Report {
  id: string;
  type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  dateRange: string;
  createdAt: string;
  downloadUrl?: string;
}

const TYPE_LABELS: Record<string, string> = {
  sales: 'Ventas',
  revenue: 'Ingresos',
  products: 'Productos',
  vendors: 'Vendedores',
  users: 'Usuarios',
  returns: 'Devoluciones',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  generating: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  generating: 'Generando',
  completed: 'Completado',
  failed: 'Fallido',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/reports`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setReports(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const generateReport = async () => {
    setGenerating(reportType);
    try {
      const res = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: reportType, dateFrom, dateTo }),
      });
      if (!res.ok) throw new Error();
      toast('Reporte generado exitosamente', 'success');
      load();
    } catch {
      toast('Error al generar reporte', 'error');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reportes</h1>
        <p className="text-sm text-zinc-500 mt-1">Genera y descarga reportes del marketplace.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <h2 className="font-semibold text-lg">Generar nuevo reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Tipo</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={generating !== null} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 w-full justify-center">
              <DocumentArrowDownIcon className="h-4 w-4" />{generating === reportType ? 'Generando...' : 'Generar'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay reportes generados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Tipo', 'Rango', 'Estado', 'Fecha', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{r.dateRange || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    {r.status === 'completed' && r.downloadUrl && (
                      <a href={r.downloadUrl} download className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200">
                        <DocumentArrowDownIcon className="h-3 w-3" />Descargar
                      </a>
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
