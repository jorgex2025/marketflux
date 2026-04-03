'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/config').then((r) => r.json()).then((d) => {
      const raw = d.data ?? d;
      setConfigs(Array.isArray(raw) ? raw : Object.entries(raw).map(([key, value]) => ({ key, value })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    try {
      const res = await fetch(`/api/proxy/config/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
      toast(`${key} actualizado`, 'success');
    } catch { toast('Error al guardar', 'error'); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración de plataforma</h1>
      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {configs.map((c) => (
            <ConfigRow key={c.key} config={c} onSave={handleSave} saving={saving === c.key} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigRow({ config, onSave, saving }: { config: any; onSave: (k: string, v: string) => void; saving: boolean }) {
  const [value, setValue] = useState(String(config.value ?? ''));
  return (
    <div className="bg-white border rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-mono font-medium text-gray-700">{config.key}</p>
        <input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <button onClick={() => onSave(config.key, value)} disabled={saving || value === String(config.value ?? '')} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40">{saving ? 'Guardando…' : 'Guardar'}</button>
    </div>
  );
}
