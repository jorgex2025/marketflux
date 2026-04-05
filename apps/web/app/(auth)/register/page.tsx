'use client';

import type { Metadata } from 'next';
import { useState, type FormEvent } from 'react';

export const metadata: Metadata = {
  title: 'Crear cuenta — MarketFlux',
  description: 'Regístrate en MarketFlux y empieza a comprar.',
};
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../../lib/auth-client';
import { authClient } from '../../../lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    setError(null);

    const result = await authClient.signUp.email({ name, email, password });

    if (result.error) {
      setError(result.error.message ?? 'Error al registrarse');
      setLoading(false);
      return;
    }

    // Auto-login tras registro
    await signIn.email({ email, password });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">Empieza a comprar en MarketFlux</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              id="name" type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <input
              id="confirm" type="password" required value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Repite tu contraseña"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold
                       text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
