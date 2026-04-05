'use client';

import type { Metadata } from 'next';
import { useState, type FormEvent } from 'react';

export const metadata: Metadata = {
  title: 'Iniciar sesión — MarketFlux',
  description: 'Accede a tu cuenta en MarketFlux.',
};
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../../lib/auth-client';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') ?? '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? 'Credenciales inválidas');
      setLoading(false);
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-500">Bienvenido de vuelta a MarketFlux</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold
                       text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Regístrate
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-gray-400 hover:text-gray-600 text-xs">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}
