'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/inventory?mine=true`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setItems(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStock = async (id: string, newStock: number) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API}/inventory/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stock: newStock }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const data = updated.data ?? updated;
      setItems((items) =>
        items.map((x) =>
          x.id === id
            ? { ...x, stock: data.stock, available: data.stock - (data.reserved ?? 0), status: data.stock <= 0 ? 'out_of_stock' : data.stock <= (data.lowStockThreshold ?? 5) ? 'low_stock' : 'in_stock' }
            : x
        )
      );
      toast('Stock actualizado', 'success');
      setEditingStock(null);
    } catch {
      toast('Error al actualizar stock', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const adjustStock = async (id: string, delta: number) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    await updateStock(id, newStock);
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
  const lowStockCount = items.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;

  const STATUS_STYLES: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-700',
    out_of_stock: 'bg-red-100 text-red-700',
  };

  const STATUS_LABELS: Record<string, string> = {
    in_stock: 'En stock',
    low_stock: 'Stock bajo',
    out_of_stock: 'Sin stock',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Inventario</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona el stock de tus productos.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Total stock</p>
          <p className="text-2xl font-bold text-zinc-900">{totalStock}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Productos</p>
          <p className="text-2xl font-bold text-zinc-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Stock bajo</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Sin stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No se encontraron productos en el inventario.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Producto', 'SKU', 'Stock', 'Reservado', 'Disponible', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.sku}</td>
                  <td className="px-4 py-3">
                    {editingStock === item.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={stockValue} onChange={(e) => setStockValue(e.target.value)} min="0" className="w-20 border border-zinc-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => updateStock(item.id, Number(stockValue))} disabled={updating} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50">✓</button>
                        <button onClick={() => setEditingStock(null)} className="text-xs text-zinc-400 px-1">×</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingStock(item.id); setStockValue(String(item.stock)); }} className="font-bold text-zinc-900 hover:text-indigo-600">{item.stock}</button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{item.reserved ?? 0}</td>
                  <td className="px-4 py-3 font-medium">{item.available}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[item.status]}`}>{STATUS_LABELS[item.status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustStock(item.id, -1)} disabled={item.stock <= 0} className="w-7 h-7 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center text-sm hover:bg-zinc-200 disabled:opacity-30">−</button>
                      <button onClick={() => adjustStock(item.id, 1)} className="w-7 h-7 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center text-sm hover:bg-zinc-200">+</button>
                      <button onClick={() => adjustStock(item.id, 10)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">+10</button>
                    </div>
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
