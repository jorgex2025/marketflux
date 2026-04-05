'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Mis direcciones — MarketFlux',
  description: 'Administra tus direcciones de envío.',
};

interface Address { id: string; label: string; street: string; city: string; country: string; postalCode?: string; isDefault: boolean; }

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ label: '', street: '', city: '', country: 'Colombia', postalCode: '' });

  useEffect(() => {
    fetch('/api/proxy/addresses')
      .then((r) => r.json())
      .then((d) => setAddresses(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/proxy/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setAddresses((a) => [...a, created.data ?? created]);
      setForm({ label: '', street: '', city: '', country: 'Colombia', postalCode: '' });
      toast('Dirección agregada', 'success');
    } catch { toast('Error al agregar dirección', 'error'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/proxy/addresses/${id}`, { method: 'DELETE' });
      setAddresses((a) => a.filter((x) => x.id !== id));
      toast('Dirección eliminada', 'info');
    } catch { toast('Error al eliminar', 'error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis direcciones</h1>
      <div className="space-y-3 mb-8">
        {loading ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />) :
          addresses.length === 0 ? <p className="text-gray-400 text-sm">No tienes direcciones guardadas</p> :
          addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between border rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-sm">{a.label} {a.isDefault && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-1">Predeterminada</span>}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.street}, {a.city}, {a.country} {a.postalCode}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
            </div>
          ))}
      </div>
      <form onSubmit={handleAdd} className="border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-sm">Nueva dirección</h2>
        {(['label', 'street', 'city', 'country', 'postalCode'] as const).map((f) => (
          <input key={f} value={form[f]} onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))} placeholder={f === 'label' ? 'Etiqueta (Casa, Oficina…)' : f === 'street' ? 'Calle / Dirección' : f === 'city' ? 'Ciudad' : f === 'country' ? 'País' : 'Código postal'} className="w-full border rounded-lg px-3 py-2 text-sm" />
        ))}
        <button type="submit" disabled={adding} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          <PlusIcon className="h-4 w-4" />{adding ? 'Guardando...' : 'Agregar dirección'}
        </button>
      </form>
    </div>
  );
}
