'use client';

import { useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export default function SettingsPage() {
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast('Las contraseñas no coinciden', 'error'); return; }
    if (newPw.length < 8) { toast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) throw new Error('Contraseña actual incorrecta');
      toast('Contraseña actualizada', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <form onSubmit={handleChangePw} className="space-y-4">
        <h2 className="font-semibold">Cambiar contraseña</h2>
        {[
          { label: 'Contraseña actual', value: currentPw, set: setCurrentPw },
          { label: 'Nueva contraseña', value: newPw, set: setNewPw },
          { label: 'Confirmar nueva contraseña', value: confirmPw, set: setConfirmPw },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input type="password" value={value} onChange={(e) => set(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        ))}
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">{loading ? 'Actualizando...' : 'Actualizar contraseña'}</button>
      </form>
    </div>
  );
}
