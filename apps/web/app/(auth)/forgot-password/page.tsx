'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { authClient } from '../../../lib/auth-client';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authClient.forgetPassword({ email, redirectTo: '/reset-password' });
      setSent(true);
    } catch {
      setError('No se pudo enviar el correo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-bold">Revisa tu correo</h2>
          <p className="text-sm text-gray-500">
            Te enviamos un enlace para restablecer tu contraseña a <strong>{email}</strong>.
          </p>
          <Link href="/login" className="text-indigo-600 text-sm hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu correo y te enviaremos un enlace de recuperación.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="tu@email.com"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold
                       text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="text-indigo-600 hover:underline">Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
